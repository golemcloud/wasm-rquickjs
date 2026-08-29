//! Shared Preview 3 response-body ownership for `fetch` and `node:http`.

use wasip3::http::types::{ErrorCode, Response, Trailers};
use wasip3::wit_bindgen::rt::async_support::{
    FutureReader, FutureWriter, StreamReader, StreamResult,
};

type BodyResultReader = FutureReader<Result<Option<Trailers>, ErrorCode>>;
type ResponseResultWriter = FutureWriter<Result<(), ErrorCode>>;

enum ResponseBodyState {
    Unconsumed(Response),
    Reading {
        reader: StreamReader<u8>,
        result: BodyResultReader,
        response_result: ResponseResultWriter,
    },
    Finishing {
        result: BodyResultReader,
        response_result: ResponseResultWriter,
    },
    Consumed,
}

/// Owns a native Preview 3 response until its body reaches EOF or is deliberately discarded.
///
/// A cancelled `read_chunk` future drops the state moved into that future, including the stream
/// reader, body-result future, response-result writer, and response. The owner remains consumed,
/// which prevents a cancelled transport operation from being resumed with stale resources.
pub(crate) struct ResponseBody {
    state: ResponseBodyState,
}

impl ResponseBody {
    pub(crate) fn empty() -> Self {
        Self {
            state: ResponseBodyState::Consumed,
        }
    }

    pub(crate) fn new(response: Response) -> Self {
        Self {
            state: ResponseBodyState::Unconsumed(response),
        }
    }

    pub(crate) fn discard(&mut self) {
        self.state = ResponseBodyState::Consumed;
    }

    pub(crate) async fn read_chunk(&mut self) -> Result<Option<Vec<u8>>, String> {
        let state = std::mem::replace(&mut self.state, ResponseBodyState::Consumed);
        match state {
            ResponseBodyState::Unconsumed(response) => {
                let (response_result, response_result_reader) =
                    wasip3::wit_future::new(|| Ok::<(), ErrorCode>(()));
                let (reader, result) = Response::consume_body(response, response_result_reader);
                self.state = ResponseBodyState::Reading {
                    reader,
                    result,
                    response_result,
                };
                self.read_from_reader().await
            }
            ResponseBodyState::Reading {
                reader,
                result,
                response_result,
            } => {
                self.state = ResponseBodyState::Reading {
                    reader,
                    result,
                    response_result,
                };
                self.read_from_reader().await
            }
            ResponseBodyState::Finishing {
                result,
                response_result,
            } => {
                drop(response_result);
                match result.await {
                    Ok(_) => Ok(None),
                    Err(error) => Err(format!("HTTP response body error: {error:?}")),
                }
            }
            ResponseBodyState::Consumed => Ok(None),
        }
    }

    async fn read_from_reader(&mut self) -> Result<Option<Vec<u8>>, String> {
        let state = std::mem::replace(&mut self.state, ResponseBodyState::Consumed);
        let ResponseBodyState::Reading {
            mut reader,
            result,
            response_result,
        } = state
        else {
            return Ok(None);
        };

        const CHUNK_SIZE: usize = 16 * 1024;
        loop {
            let (status, bytes) = reader.read(Vec::with_capacity(CHUNK_SIZE)).await;
            match status {
                StreamResult::Complete(_) if !bytes.is_empty() => {
                    self.state = ResponseBodyState::Reading {
                        reader,
                        result,
                        response_result,
                    };
                    return Ok(Some(bytes));
                }
                StreamResult::Complete(_) => continue,
                StreamResult::Dropped => {
                    drop(reader);
                    if bytes.is_empty() {
                        drop(response_result);
                        return match result.await {
                            Ok(_) => Ok(None),
                            Err(error) => Err(format!("HTTP response body error: {error:?}")),
                        };
                    }
                    self.state = ResponseBodyState::Finishing {
                        result,
                        response_result,
                    };
                    return Ok(Some(bytes));
                }
                StreamResult::Cancelled => return Ok(None),
            }
        }
    }
}

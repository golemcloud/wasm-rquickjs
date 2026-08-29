//! Shared Preview 3 response-body ownership for `fetch` and `node:http`.

use std::future::IntoFuture;
use std::pin::Pin;
use wasip3::http::types::{ErrorCode, Response, Trailers};
use wasip3::wit_bindgen::rt::async_support::{
    FutureReader, FutureWriter, StreamReader, StreamResult,
};

type BodyResultReader = FutureReader<Result<Option<Trailers>, ErrorCode>>;
type BodyResultFuture = Pin<Box<<BodyResultReader as IntoFuture>::IntoFuture>>;
type ResponseResultWriter = FutureWriter<Result<(), ErrorCode>>;

enum ResponseBodyState {
    Unconsumed(Response),
    Reading {
        reader: StreamReader<u8>,
        result: BodyResultReader,
        response_result: ResponseResultWriter,
    },
    Finishing {
        result: BodyResultFuture,
        response_result: Option<ResponseResultWriter>,
    },
    Consumed,
}

/// Owns a native Preview 3 response until its body reaches EOF or is deliberately discarded.
///
/// A cancelled `read_chunk` future leaves the current state in this owner. This lets a surviving
/// clone resume a shared body after another clone cancels its pending read. Deliberate disposal of
/// the owner still drops the reader, body-result future, response-result writer, and response.
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
        if matches!(self.state, ResponseBodyState::Unconsumed(_)) {
            let ResponseBodyState::Unconsumed(response) =
                std::mem::replace(&mut self.state, ResponseBodyState::Consumed)
            else {
                unreachable!();
            };
            let (response_result, response_result_reader) =
                wasip3::wit_future::new(|| Ok::<(), ErrorCode>(()));
            let (reader, result) = Response::consume_body(response, response_result_reader);
            self.state = ResponseBodyState::Reading {
                reader,
                result,
                response_result,
            };
        }

        match &self.state {
            ResponseBodyState::Reading { .. } => self.read_from_reader().await,
            ResponseBodyState::Finishing { .. } => self.finish().await,
            ResponseBodyState::Consumed => Ok(None),
            ResponseBodyState::Unconsumed(_) => unreachable!(),
        }
    }

    async fn read_from_reader(&mut self) -> Result<Option<Vec<u8>>, String> {
        const CHUNK_SIZE: usize = 16 * 1024;
        loop {
            let (status, bytes) = {
                let ResponseBodyState::Reading { reader, .. } = &mut self.state else {
                    return Ok(None);
                };
                reader.read(Vec::with_capacity(CHUNK_SIZE)).await
            };
            match status {
                StreamResult::Complete(_) if !bytes.is_empty() => return Ok(Some(bytes)),
                StreamResult::Complete(_) => continue,
                StreamResult::Dropped => {
                    let ResponseBodyState::Reading {
                        reader,
                        result,
                        response_result,
                    } = std::mem::replace(&mut self.state, ResponseBodyState::Consumed)
                    else {
                        unreachable!();
                    };
                    drop(reader);
                    self.state = ResponseBodyState::Finishing {
                        result: Box::pin(result.into_future()),
                        response_result: Some(response_result),
                    };
                    return if bytes.is_empty() {
                        self.finish().await
                    } else {
                        Ok(Some(bytes))
                    };
                }
                StreamResult::Cancelled => {
                    self.state = ResponseBodyState::Consumed;
                    return Ok(None);
                }
            }
        }
    }

    async fn finish(&mut self) -> Result<Option<Vec<u8>>, String> {
        let outcome = {
            let ResponseBodyState::Finishing {
                result,
                response_result,
            } = &mut self.state
            else {
                return Ok(None);
            };
            drop(response_result.take());
            result.as_mut().await
        };
        self.state = ResponseBodyState::Consumed;
        match outcome {
            Ok(_) => Ok(None),
            Err(error) => Err(format!("HTTP response body error: {error:?}")),
        }
    }
}

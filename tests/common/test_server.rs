use axum::body::Body;
use axum::extract::{Multipart, Path};
use axum::http::HeaderMap;
use axum::response::{AppendHeaders, IntoResponse};
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use http::{StatusCode, header};
use indoc::formatdoc;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use tokio::sync::Mutex;
use tokio::sync::mpsc::UnboundedReceiver;
use tokio::task::JoinHandle;
use tokio_util::io::ReaderStream;

pub async fn start_test_server() -> (u16, JoinHandle<()>) {
    let (port, handle, _arrivals) = start_test_server_with_arrivals().await;
    (port, handle)
}

/// Same as [`start_test_server`], but also returns a receiver that yields once
/// for every request that reaches `/slow-response`.
///
/// `/slow-response` records the arrival and only then sleeps, so a test can tell
/// "the request actually reached the server and was later cancelled" apart from
/// "the request never got out" — which a bare connection failure looks like.
pub async fn start_test_server_with_arrivals() -> (u16, JoinHandle<()>, UnboundedReceiver<()>) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await.unwrap();
    let host_http_port = listener.local_addr().unwrap().port();

    let (arrived_tx, arrived_rx) = tokio::sync::mpsc::unbounded_channel();

    let handle = tokio::spawn(async move {
        // Lets the guest confirm its slow request arrived before it aborts, so the
        // abort cannot race the request going out.
        let slow_hits = Arc::new(AtomicUsize::new(0));
        let slow_hits_1 = slow_hits.clone();
        let slow_hits_2 = slow_hits.clone();

        // Counts requests to `/immediate-response`, which answers 200 at once
        // without reading the body — so a guest can tell its request arrived (and
        // was therefore already answered) while its upload is still draining.
        let immediate_hits = Arc::new(AtomicUsize::new(0));
        let immediate_hits_1 = immediate_hits.clone();
        let immediate_hits_2 = immediate_hits.clone();

        // Counts hops through `/slow-redirect`, a deliberately slow self-redirect
        // chain. A guest can abort mid-chain and then check that the hop count
        // stops climbing — proving no further requests were issued after abort.
        let redirect_hits = Arc::new(AtomicUsize::new(0));
        let redirect_hits_1 = redirect_hits.clone();
        let redirect_hits_2 = redirect_hits.clone();

        let state_mutex = Arc::new(Mutex::new(State::default()));

        let state_mutex_1 = state_mutex.clone();
        let state_mutex_2 = state_mutex.clone();
        let state_mutex_3 = state_mutex.clone();

        let router = Router::new()
            .route(
                "/todos",
                post(async move |body: Bytes| {
                    let mut state = state_mutex_1.lock().await;

                    let req = serde_json::from_slice::<NewTodo>(&body).unwrap();

                    let todo_id = state.current_todo_id;
                    let todo = Todo {
                        id: todo_id,
                        user_id: req.user_id,
                        title: req.title,
                        body: req.body,
                        completed: false,
                    };

                    let response = (StatusCode::CREATED, Json(&todo)).into_response();

                    state.todos.push(todo);
                    state.current_todo_id += 1;

                    response
                }),
            )
            .route(
                "/todos",
                get(async move || {
                    let state = state_mutex_2.lock().await;

                    Json(&state.todos).into_response()
                }),
            )
            .route(
                "/todos/{todo_id}",
                get(async move |Path((todo_id,)): Path<(usize,)>| {
                    let state = state_mutex_3.lock().await;

                    let todo = state.todos.get(todo_id);

                    if let Some(todo) = todo {
                        Json(todo).into_response()
                    } else {
                        StatusCode::NOT_FOUND.into_response()
                    }
                }),
            )
            .route(
                "/todos-stream",
                get(async move || {
                    let mut todos = Vec::new();
                    for i in 0..100 {
                        todos.push(Todo {
                            id: i,
                            user_id: 1,
                            title: format!("todo_title_{i}"),
                            body: format!("todo_body_{i}"),
                            completed: i % 2 == 0,
                        });
                    }

                    let json_bytes = serde_json::to_vec(&todos).unwrap();

                    let body_stream = ReaderStream::with_capacity(Cursor::new(json_bytes), 100);

                    (
                        AppendHeaders([(header::CONTENT_TYPE, "application/json")]),
                        Body::from_stream(body_stream),
                    )
                }),
            )
            .route(
                "/echo",
                post(async move |body: Body| {
                    (
                        AppendHeaders([(header::CONTENT_TYPE, "application/octet-stream")]),
                        body,
                    )
                }),
            )
            .route(
                "/echo-form",
                post(async move |mut multipart: Multipart| {
                    let mut parts = Vec::new();

                    while let Some(field) = multipart.next_field().await.unwrap() {
                        let name = field.name().unwrap().to_string();
                        let data = field.bytes().await.unwrap();

                        parts.push(MultiPartPart {
                            name,
                            data: data.to_vec(),
                        });
                    }

                    Json(parts)
                }),
            )
            .route(
                "/form-echo",
                post(async move |body: Bytes| {
                    let body_str = String::from_utf8(body.to_vec()).unwrap_or_default();
                    Json(serde_json::json!({
                        "body": body_str,
                        "type": "application/x-www-form-urlencoded"
                    }))
                }),
            )
            .route(
                "/echo-referer",
                post(async move |headers: HeaderMap| {
                    let referer = headers
                        .get("referer")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    Json(serde_json::json!({
                        "referer": referer
                    }))
                }),
            )
            .route(
                "/echo-credentials",
                post(async move |headers: HeaderMap| {
                    let authorization = headers
                        .get("authorization")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    let cookie = headers
                        .get("cookie")
                        .and_then(|h| h.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    (
                        AppendHeaders([(header::SET_COOKIE, "test-cookie=test-value")]),
                        Json(serde_json::json!({
                            "authorization": authorization,
                            "cookie": cookie
                        })),
                    )
                }),
            )
            .route(
                "/redirect-to",
                axum::routing::any(async move |query: axum::extract::Query<RedirectParams>| {
                    let status = StatusCode::from_u16(query.status).unwrap_or(StatusCode::FOUND);
                    (status, [("Location", query.url.clone())]).into_response()
                }),
            )
            .route(
                "/redirect-loop",
                get(async move || {
                    (StatusCode::FOUND, [("Location", "/redirect-loop")]).into_response()
                }),
            )
            .route(
                "/form-response",
                get(|| async {
                    let boundary = "WebKitFormBoundary7MA4YWxkTrZu0gW";
                    let body = formatdoc! {
                    "--{boundary}
                     Content-Disposition: form-data; name=\"username\"

                     john_doe
                     --{boundary}
                     Content-Disposition: form-data; name=\"email\"

                     john@example.com
                     --{boundary}
                     Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"
                     Content-Type: text/plain

                     Hello World
                     --{boundary}--"};
                    (
                        [(
                            "Content-Type",
                            format!("multipart/form-data; boundary={}", boundary),
                        )],
                        body,
                    )
                        .into_response()
                }),
            )
            .route(
                "/slow-response",
                get(async move || {
                    // Record the arrival before stalling, so both the guest (by
                    // polling /slow-response-hits) and the test (via the arrivals
                    // channel) can tell that the request really reached the server.
                    // The stall then has to outlast anything a "released promptly"
                    // assertion would accept.
                    slow_hits_1.fetch_add(1, Ordering::SeqCst);
                    let _ = arrived_tx.send(());
                    tokio::time::sleep(std::time::Duration::from_secs(30)).await;
                    "slow body"
                }),
            )
            .route(
                "/slow-response-hits",
                get(async move || slow_hits_2.load(Ordering::SeqCst).to_string()),
            )
            .route(
                "/immediate-response",
                post(async move || {
                    // Deliberately take no body extractor: axum answers as soon
                    // as the head arrives, so the response comes back while the
                    // guest's (slow/never-resolving) upload is still in flight.
                    immediate_hits_1.fetch_add(1, Ordering::SeqCst);
                    "ok"
                }),
            )
            .route(
                "/immediate-response-hits",
                get(async move || immediate_hits_2.load(Ordering::SeqCst).to_string()),
            )
            .route(
                "/slow-redirect",
                // `any` so the first POST hop and the GET hops it decays into
                // after a 302 both match.
                axum::routing::any(async move || {
                    // Record the hop, wait, then redirect back to ourselves — a
                    // slow chain the guest can abort part-way through.
                    redirect_hits_1.fetch_add(1, Ordering::SeqCst);
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                    (StatusCode::FOUND, [("Location", "/slow-redirect")]).into_response()
                }),
            )
            .route(
                "/slow-redirect-hits",
                get(async move || redirect_hits_2.load(Ordering::SeqCst).to_string()),
            );

        axum::serve(listener, router).await.unwrap();
    });

    (host_http_port, handle, arrived_rx)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Todo {
    id: usize,
    user_id: u64,
    title: String,
    body: String,
    completed: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewTodo {
    user_id: u64,
    title: String,
    body: String,
}

#[derive(Debug, Deserialize)]
struct RedirectParams {
    url: String,
    status: u16,
}

#[derive(Default)]
struct State {
    current_todo_id: usize,
    todos: Vec<Todo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MultiPartPart {
    name: String,
    data: Vec<u8>,
}

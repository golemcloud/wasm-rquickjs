use tokio::task::JoinHandle;
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use http::{HeaderMap, StatusCode};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use std::sync::Arc;
use axum::extract::Path;
use axum::response::IntoResponse;

pub async fn start_test_server() -> (u16, JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await.unwrap();
    let host_http_port = listener.local_addr().unwrap().port();

    let handle = tokio::spawn(
        async move {
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
                            completed: false
                        };

                        let response = (
                            StatusCode::CREATED,
                            Json(&todo)
                        ).into_response();

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
                    })
                )
                .route(
                    "/todos/{todo_id}",
                    get(async move | Path((todo_id,)): Path<(usize,)> | {
                        let state = state_mutex_3.lock().await;

                        let todo = state.todos.get(todo_id);

                        if let Some(todo) = todo {
                            Json(todo).into_response()
                        } else {
                            StatusCode::NOT_FOUND.into_response()
                        }
                    }),
                );

            axum::serve(listener, router).await.unwrap();
        },
    );

    (host_http_port, handle)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Todo {
    id: usize,
    user_id: u64,
    title: String,
    body: String,
    completed: bool
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewTodo {
    user_id: u64,
    title: String,
    body: String,
}

struct State {
    current_todo_id: usize,
    todos: Vec<Todo>
}

impl Default for State {
    fn default() -> Self {
        Self {
            current_todo_id: 0,
            todos: Vec::new()
        }
    }
}

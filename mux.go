package main

import "net/http"

func Mux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /check", handleCheck)
	mux.HandleFunc("POST /api/start-ftp", handleStart)
	mux.HandleFunc("POST /api/stop-ftp", handleStop)
	mux.HandleFunc("GET /api/logs", handleLogs)

	return mux
}

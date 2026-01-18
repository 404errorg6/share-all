package main

import "net/http"

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./frontend"))

	mux.Handle("/", fs)
	mux.HandleFunc("GET /check", handleCheck)
	mux.HandleFunc("POST /api/start-ftp", handleStart)
	mux.HandleFunc("POST /api/stop-ftp", handleStop)
	mux.HandleFunc("GET /api/logs", handleLogs)
	//FTP handles
	mux.HandleFunc("GET /api/ls", handleLS)
	mux.HandleFunc("GET /api/file", handleFile)
	mux.HandleFunc("POST /api/client/connect", handleConnectClient)
	return mux
}

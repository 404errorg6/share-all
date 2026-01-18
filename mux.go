package main

import "net/http"

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./frontend"))
	//http handles
	mux.Handle("/", fs)                                //sevrer frontend
	mux.HandleFunc("POST /api/start-ftp", handleStart) //start ftp server
	mux.HandleFunc("POST /api/stop-ftp", handleStop)   //stop ftp server
	mux.HandleFunc("GET /api/logs", handleLogs)        //get logs
	//FTP server handles
	mux.HandleFunc("GET /api/ftp/server/ls", handleLS)                              //list directory on server
	mux.HandleFunc("GET /api/ftp/server/get-file", handleStreamFile)                //stream file
	mux.HandleFunc("GET /api/ftp/server/connected-clients", handleConnectedClients) //get connected clients to server
	//FTP client handles
	mux.HandleFunc("POST /api/ftp/server/connect", handleConnectToServer) //connect to other server
	mux.HandleFunc("POST /api/ftp/client/auth", handleAuthClient)         //authenticate client trying to connect to this server, with auth
	return mux
}

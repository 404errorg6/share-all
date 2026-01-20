package main

import "net/http"

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	// Serve Frontend Static Files
	fs := http.FileServer(http.Dir("./frontend"))
	//http handles
	mux.Handle("/", fs)                         //serve frontend
	mux.HandleFunc("GET /api/logs", handleLogs) //get logs
	//FTP server handles
	mux.HandleFunc("POST /api/start-ftp", handleStartFTP)                              //start ftp server
	mux.HandleFunc("POST /api/stop-ftp", handleStopFTP)                                //stop ftp server
	mux.HandleFunc("GET /api/ftp/server/ls", handleListDir)                            //list other server directory
	mux.HandleFunc("GET /api/ftp/server/get-file", handleStreamFile)                   //get file from other server
	mux.HandleFunc("GET /api/ftp/server/connected-clients", handleGetConnectedClients) //get clients connected to own server
	//FTP client handles
	mux.HandleFunc("POST /api/ftp/client/connect-to-server", handleConnectToServer) //connect to other server
	return mux
}

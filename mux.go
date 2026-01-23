package main

import (
	"net/http"

	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
	httphandlers "github.com/404errorg6/FTP-server/handlers/http_handlers"
	serverhandlers "github.com/404errorg6/FTP-server/handlers/server_handlers"
)

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	// Serve Frontend Static Files
	fs := http.FileServer(http.Dir("./frontend"))
	//http Handles
	mux.Handle("/", fs)                                      //serve frontend
	mux.HandleFunc("GET /api/logs", httphandlers.HandleLogs) //get logs
	//FTP server Handles
	mux.HandleFunc("POST /api/start-ftp", serverhandlers.HandleStartFTP) //start ftp server
	mux.HandleFunc("POST /api/stop-ftp", serverhandlers.HandleStopFTP)   //stop ftp server	// TODO: change path to api/ftp/server/
	mux.HandleFunc("GET /api/ftp/server/status", serverhandlers.HandleServerStatus)
	mux.HandleFunc("GET /api/ftp/server/ls", serverhandlers.HandleListDir)                            //list other server directory
	mux.HandleFunc("GET /api/ftp/server/get-file", serverhandlers.HandleServeFile)                    //get file from other server
	mux.HandleFunc("GET /api/ftp/server/connected-clients", serverhandlers.HandleGetConnectedClients) //get clients connected to own server
	//FTP client Handles
	mux.HandleFunc("POST /api/ftp/client/connect-to-server", clienthandlers.HandleConnectToServer) //connect to other server
	return mux
}

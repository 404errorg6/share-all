package main

import (
	"net/http"

	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
	httphandlers "github.com/404errorg6/FTP-server/handlers/http_handlers"
	serverhandlers "github.com/404errorg6/FTP-server/handlers/server_handlers"
)

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./frontend"))
	//http Handles
	mux.Handle("/", fs)                                      //serve frontend
	mux.HandleFunc("GET /api/logs", httphandlers.HandleLogs) //get logs
	//FTP server Handles
	//required Form variables: server_port, server_root_dir, anonymous_allowed, write_allowed
	mux.HandleFunc("POST /api/start-ftp", serverhandlers.HandleStartFTP) //start ftp server
	mux.HandleFunc("POST /api/stop-ftp", serverhandlers.HandleStopFTP)   //stop ftp server	// TODO: change path to api/ftp/server/
	//returns string responses: "running" and "not-running"
	mux.HandleFunc("GET /api/ftp/server/status", serverhandlers.HandleServerStatus)
	//required query variables: path, returns the folder's entries in a list of FSObject, see ftp/config/config.go for FSObject
	mux.HandleFunc("GET /api/ftp/server/ls", serverhandlers.HandleListDir) //list other server directory
	//required query variables: path, returns the file at path
	mux.HandleFunc("GET /api/ftp/server/get-file", serverhandlers.HandleServeFile) //get file from other server
	//nothing required, returns a list of addresses of connected clients
	mux.HandleFunc("GET /api/ftp/server/connected-clients", serverhandlers.HandleGetConnectedClients) //get clients connected to own server
	//FTP client Handles
	//required Form variables: server_host, server_port, user, password, anonymous
	mux.HandleFunc("POST /api/ftp/client/connect-to-server", clienthandlers.HandleConnectToServer) //connect to other server
	//Required query variables: path, return list of FSObject
	mux.HandleFunc("GET /api/ftp/client/ls", clienthandlers.HandleGetLocalFolderEntries) //Get local folder info
	return mux
}

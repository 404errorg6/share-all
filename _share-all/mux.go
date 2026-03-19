package main

import (
	"changeme/internal/config"
	clienthandlers "changeme/internal/handlers/client_handlers"
	httphandlers "changeme/internal/handlers/http_handlers"
	serverhandlers "changeme/internal/handlers/server_handlers"
	"net/http"
)

func Mux() *http.ServeMux {
	mux := http.NewServeMux()

	// HTTP Handles
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { // Root logic
		config.AssetsServer.ServeHTTP(w, r)
	})
	mux.HandleFunc("POST /api/http/web-share/start", httphandlers.HandleStartWebUI)
	mux.HandleFunc("POST /api/http/web-share/stop", httphandlers.HandleStopWebUI)
	mux.HandleFunc("GET /api/http/web-share/status", httphandlers.HandleWebStatus)

	//FTP server Handles
	mux.HandleFunc("POST /api/ftp/server/start-ftp", serverhandlers.HandleStartFTP) //start ftp server
	mux.HandleFunc("POST /api/ftp/server/stop-ftp", serverhandlers.HandleStopFTP)   //stop ftp server
	mux.HandleFunc("GET /api/ftp/server/status", serverhandlers.HandleServerStatus)
	mux.HandleFunc("GET /api/ftp/server/get-file", serverhandlers.HandleServeFile)                    //stream file for preview
	mux.HandleFunc("GET /api/ftp/server/connected-clients", serverhandlers.HandleGetConnectedClients) //get clients connected to own server
	mux.HandleFunc("GET /api/ftp/server/blacklist-client", serverhandlers.HandlerGetBlacklist)        //get list of blacklisted ips
	mux.HandleFunc("POST /api/ftp/server/blacklist-client", serverhandlers.BlockClient)               //block a new ip
	mux.HandleFunc("POST /api/ftp/server/whitelist-client", serverhandlers.UnblockClient)             //whitelist a blocked transfers

	//FTP client Handles
	mux.HandleFunc("POST /api/ftp/client/connect-to-server", clienthandlers.HandleConnectToServer) //connect to server
	mux.HandleFunc("GET /api/ftp/client/status", clienthandlers.HandleStatus)
	mux.HandleFunc("GET /api/ftp/client/local/ls", clienthandlers.HandleListLocalDir)   //Get local folder info, path required
	mux.HandleFunc("GET /api/ftp/client/remote/ls", clienthandlers.HandleListRemoteDir) //Get remote folder info, remote_path required
	mux.HandleFunc("GET /api/ftp/client/get-file", clienthandlers.HandleServeFile)      //stream file for preview, path required
	mux.HandleFunc("POST /api/ftp/client/download", clienthandlers.HandleDownload)      //download from server, remote_path, local_path required
	mux.HandleFunc("POST /api/ftp/client/upload", clienthandlers.HandleUpload)          //upload to server, remote_path, local_path required
	mux.HandleFunc("POST /api/ftp/client/delete", clienthandlers.HandleDelete)          //delete from local, local_path required
	mux.HandleFunc("GET /api/ftp/discover", clienthandlers.HandlerDiscoverServers)
	mux.HandleFunc("GET /api/ftp/transfers", clienthandlers.HandleTransfer)
	return mux
}

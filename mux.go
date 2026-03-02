package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"

	clienthandlers "github.com/404errorg6/FTP-server/handlers/client_handlers"
	httphandlers "github.com/404errorg6/FTP-server/handlers/http_handlers"
	serverhandlers "github.com/404errorg6/FTP-server/handlers/server_handlers"
)

//go:embed frontend
var frontend embed.FS

func Mux() *http.ServeMux {
	mux := http.NewServeMux()
	// Static Assets & Pages
	assets, err := fs.Sub(frontend, "frontend") //cd into the frontend
	if err != nil {
		log.Fatalf("Error while removing frontend prefix: %v\n", err)
	}

	assetsServer := http.FileServer(http.FS(assets))

	// Root Redirect to Browse Local
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/pages/browse-local.html", http.StatusTemporaryRedirect)
			return
		}
		assetsServer.ServeHTTP(w, r)
	})

	mux.HandleFunc("GET /api/logs", httphandlers.HandleLogs) //get logs
	//FTP server Handles
	mux.HandleFunc("POST /api/ftp/server/start-ftp", serverhandlers.HandleStartFTP) //start ftp server
	mux.HandleFunc("POST /api/ftp/server/stop-ftp", serverhandlers.HandleStopFTP)   //stop ftp server
	mux.HandleFunc("GET /api/ftp/server/running-status", serverhandlers.HandleServerStatus)
	mux.HandleFunc("GET /api/ftp/server/get-file", serverhandlers.HandleServeFile)                    //stream file for preview
	mux.HandleFunc("GET /api/ftp/server/connected-clients", serverhandlers.HandleGetConnectedClients) //get clients connected to own server
	mux.HandleFunc("GET /api/ftp/server/blacklist-client", serverhandlers.HandlerGetBlacklist)        //get list of blacklisted ips
	mux.HandleFunc("POST /api/ftp/server/blacklist-client", serverhandlers.BlockClient)               //block a new ip
	mux.HandleFunc("POST /api/ftp/server/whitelist-client", serverhandlers.WhitelistClient)           //whitelist a blocked ip

	//FTP client Handles
	mux.HandleFunc("POST /api/ftp/client/connect-to-server", clienthandlers.HandleConnectToServer) //connect to server
	mux.HandleFunc("GET /api/ftp/client/local/ls", clienthandlers.HandleListLocalDir)              //Get local folder info, path required
	mux.HandleFunc("GET /api/ftp/client/remote/ls", clienthandlers.HandleListRemoteDir)            //Get remote folder info, remote_path required
	mux.HandleFunc("GET /api/ftp/client/get-file", clienthandlers.HandleServeFile)                 //stream file for preview, path required
	mux.HandleFunc("POST /api/ftp/client/download", clienthandlers.HandleDownload)                 //download from server, remote_path, local_path required
	mux.HandleFunc("POST /api/ftp/client/upload", clienthandlers.HandleUpload)                     //upload to server, remote_path, local_path required
	mux.HandleFunc("POST /api/ftp/client/delete", clienthandlers.HandleDelete)                     //delete from local, local_path required
	mux.HandleFunc("GET /api/ftp/discover", clienthandlers.HandlerDiscoverServers)
	mux.HandleFunc("GET /api/ftp/transfers", clienthandlers.HandleTransfer)
	return mux
}

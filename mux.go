package main

import (
	"net/http"

	"github.com/404errorg6/share-all/internal/config"
	clienthandlers "github.com/404errorg6/share-all/internal/handlers/client_handlers"
	httphandlers "github.com/404errorg6/share-all/internal/handlers/http_handlers"
	p2phandlers "github.com/404errorg6/share-all/internal/handlers/p2p_handlers"
	serverhandlers "github.com/404errorg6/share-all/internal/handlers/server_handlers"
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

	// P2P shared filesystem helpers for internet mode
	mux.HandleFunc("GET /api/p2p/invite/pending", p2phandlers.HandlePendingInvite)
	mux.HandleFunc("POST /api/p2p/share/configure", p2phandlers.HandleConfigureShare)
	mux.HandleFunc("GET /api/p2p/share/status", p2phandlers.HandleShareStatus)
	mux.HandleFunc("GET /api/p2p/fs/list", p2phandlers.HandleListFS)
	mux.HandleFunc("GET /api/p2p/fs/file", p2phandlers.HandleReadFile)
	mux.HandleFunc("POST /api/p2p/fs/mkdir", p2phandlers.HandleMkdir)
	mux.HandleFunc("POST /api/p2p/fs/write/start", p2phandlers.HandleWriteStart)
	mux.HandleFunc("POST /api/p2p/fs/write/chunk", p2phandlers.HandleWriteChunk)
	mux.HandleFunc("POST /api/p2p/fs/write/finish", p2phandlers.HandleWriteFinish)
	return mux
}

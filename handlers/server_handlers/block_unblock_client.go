package serverhandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func BlockClient(w http.ResponseWriter, req *http.Request) {
	host := req.FormValue("host")
	if host == "" {
		http.Error(w, "host is required", http.StatusBadRequest)
		return
	}

	config.FTPServer.BlockUser(host)
	w.WriteHeader(http.StatusNoContent)
}

func WhitelistClient(w http.ResponseWriter, req *http.Request) {
	host := req.FormValue("host")
	if host == "" {
		http.Error(w, "host is required", http.StatusBadRequest)
		return
	}

	config.FTPServer.BlackList = config.FTPServer.UnblockUser(host)
	w.WriteHeader(http.StatusNoContent)
}

func HandlerGetBlacklist(w http.ResponseWriter, req *http.Request) {
	config.SendJSON(w, config.FTPServer.BlackList)
}

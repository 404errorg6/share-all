package serverhandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleServeFile(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	remotePath := req.FormValue("remote_path")
	fullPath, entry, err := config.ResolveRemotePath(c, remotePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if entry.Type != ftp.EntryTypeFile {
		err = fmt.Errorf("\"%v\" is not a file", remotePath)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	http.ServeFile(w, req, fullPath)
}

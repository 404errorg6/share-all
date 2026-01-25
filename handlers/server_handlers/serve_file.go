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

	path := req.URL.Query().Get("path")
	fullPath, entry, err := config.GetCompletePath(c, path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if entry.Type != ftp.EntryTypeFile {
		err = fmt.Errorf("\"%v\" is not a file", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Path: %v\n", fullPath)
	http.ServeFile(w, req, fullPath)
}

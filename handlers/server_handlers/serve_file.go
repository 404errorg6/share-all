package serverhandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleServeFile(w http.ResponseWriter, req *http.Request) {
	client.AuthClient("127.0.0.1:2121", "anonymous", "123")
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	path := req.FormValue("path")
	path, err = config.GetCompletePath(c, path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Path: %v\n", path)
	http.ServeFile(w, req, path)
}

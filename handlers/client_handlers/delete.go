package clienthandlers

import (
	"net/http"
	"os"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleDelete(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")

	if localPath != "" {
		localPath = config.ResolveLocalPath(localPath)

		err := os.RemoveAll(localPath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if remotePath != "" {
		remotePath, entry, err := config.ResolveRemotePath(c, remotePath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		if entry.Type != ftp.EntryTypeFolder {
			err := c.Delete(remotePath)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		if entry.Type == ftp.EntryTypeFolder {
			err := c.RemoveDirRecur(remotePath)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

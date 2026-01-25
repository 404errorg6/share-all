package clienthandlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleDownloadFile(w http.ResponseWriter, req *http.Request) {
	localPath := req.FormValue("local_path")
	remotePath := req.FormValue("remote_path")
	if remotePath == "" {
		http.Error(w, "remote_path is required", http.StatusBadRequest)
		return
	}

	// TODO: Get path from env var instead of hardocding
	if localPath == "" {
		home := config.DefRootDir
		testDownload1 := filepath.Join(home, "Download")
		testDownload2 := filepath.Join(home, "Downloads")

		if config.FolderExists(testDownload1) {
			localPath = testDownload1
		} else if config.FolderExists(testDownload2) {
			localPath = testDownload2
		} else {
			localPath = home
		}
	}

	localPath = config.ResolveLocalPath(localPath)
	c, err := client.GetClient()
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	remoteFile, err := c.Retr(remotePath)
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	localFile, err := os.Create(localPath)
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = io.Copy(localFile, remoteFile)
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

package serverhandlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/404errorg6/FTP-server/ftp/server"
)

func HandleStartFTP(w http.ResponseWriter, req *http.Request) {
	port := req.FormValue("server_port")
	newRoot := req.FormValue("server_root_dir")
	anonymous := req.FormValue("anonymous_allowed")

	err := initServer("", port, newRoot, anonymous)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	err = server.StartFTP()
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}

func initServer(host, port, root, anonymous string) error {
	if root == "" {
		root = config.HomeDir
	}

	root = filepath.Join(config.HomeDir, root)
	if !config.FolderExists(root) {
		err := fmt.Errorf("\"%v\" folder does not exist", root)
		return err
	}

	if port == "" {
		port = config.DefFTPPort
	}

	if host == "" {
		host = config.DefFTPHost
	}

	if anonymous == "" {
		anonymous = config.DefAnonymous
	}

	isAnonymous, err := strconv.ParseBool(anonymous)
	if err != nil {
		return err
	}

	config.Server.FTPHost = host
	config.Server.FTPPort = port
	config.Server.RootDir = root
	config.Server.AnonymousAccessAllowed = isAnonymous
	return nil
}

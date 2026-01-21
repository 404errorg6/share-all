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
	err := req.ParseForm()
	if err != nil {
		http.Error(w, "Form not provided", http.StatusBadRequest)
		return
	}

	port := req.FormValue("server_port")
	newRoot := req.FormValue("server_root_dir")
	anonymous := req.FormValue("anonymous_allowed")
	writeAllowed := req.FormValue("write_allowed")

	err = initServer("", port, newRoot, writeAllowed, anonymous)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = server.StartFTP()
	if err != nil {
		config.LogsCh <- err.Error()
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}

func initServer(host, port, root, writeAllowed, anonymous string) error {
	if root == "" {
		root = config.HomeDir
	}
	fmt.Printf("root: %v\n", root)

	if !filepath.IsAbs(root) {
		root = filepath.Join(config.HomeDir, root)
	}
	fmt.Printf("after: %v\n", root)

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

	if writeAllowed == "" {
		writeAllowed = config.DefFTPWriteAccess
	}

	isAnonymous, err := strconv.ParseBool(anonymous)
	if err != nil {
		return err
	}

	writeAllowedBool, err := strconv.ParseBool(writeAllowed)
	if err != nil {
		return err
	}

	config.Server.FTPHost = host
	config.Server.FTPPort = port
	config.Server.RootDir = root
	config.Server.AnonymousAccessAllowed = isAnonymous
	config.Server.WriteAllowed = writeAllowedBool
	return nil
}

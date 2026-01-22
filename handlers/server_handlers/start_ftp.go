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

	// TODO: Form data not given
	fmt.Printf("Form data:\n	server_port: %v\n	server_root_dir: %v\n	anonymous_allowed: %v\n	writeAllowed: %v\n", port, newRoot, anonymous, writeAllowed)

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

	if !filepath.IsAbs(root) {
		root = filepath.Join(config.HomeDir, root)
	}

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

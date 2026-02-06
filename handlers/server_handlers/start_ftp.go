package serverhandlers

import (
	"fmt"
	"net/http"
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

	user := req.FormValue("user")
	pass := req.FormValue("password")
	port := req.FormValue("server_port")
	newRoot := req.FormValue("server_root_dir")
	anonymous := req.FormValue("anonymous_allowed")
	writeAllowed := req.FormValue("write_allowed")

	fmt.Printf("Form data:\n	user: %v\n	pass: %v\n	server_port: %v\n	server_root_dir: %v\n	anonymous_allowed: %v\n	writeAllowed: %v\n", user, pass, port, newRoot, anonymous, writeAllowed)

	err = initServer(user, pass, "", port, newRoot, writeAllowed, anonymous)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = server.StartFTP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func initServer(user, pass, host, port, root, writeAllowed, anonymous string) error {
	root = config.ResolveLocalPath(root)

	if !config.LocalFolderExists(root) {
		err := fmt.Errorf("\"%v\" folder does not exist", root)
		return err
	}

	if host == "" {
		host = config.DefFTPHost
	}

	if port == "" {
		port = config.DefFTPPort
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

	if !isAnonymous {
		if user == "" && pass == "" {
			return fmt.Errorf("user/password required when anonymous_access is not false")
		}
	}

	writeAllowedBool, err := strconv.ParseBool(writeAllowed)
	if err != nil {
		return err
	}

	config.FTPServer.User = user
	config.FTPServer.Password = pass
	config.FTPServer.Host = host
	config.FTPServer.Port = port
	config.FTPServer.RootDir = root
	config.FTPServer.AnonymousAccessAllowed = isAnonymous
	config.FTPServer.WriteAllowed = writeAllowedBool
	return nil
}

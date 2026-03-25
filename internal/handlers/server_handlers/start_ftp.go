package serverhandlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"changeme/internal/config"
	"changeme/internal/ftp/server"
)

func HandleStartFTP(w http.ResponseWriter, req *http.Request) {
	err := req.ParseForm()
	if err != nil {
		er := fmt.Errorf("Error parsing form: %v", err)
		http.Error(w, er.Error(), http.StatusBadRequest)
		return
	}

	name := req.FormValue("name")
	user := req.FormValue("user")
	pass := req.FormValue("password")
	port := req.FormValue("server_port")
	newRoot := req.FormValue("server_root_dir")
	anonymous := req.FormValue("anonymous_allowed")
	writeAllowed := req.FormValue("write_allowed")

	config.LogsCh <- fmt.Sprintf("Form data:\n	name: %v\n	user: %v\n	pass: %v\n	server_port: %v\n	server_root_dir: %v\n	anonymous_allowed: %v\n	writeAllowed: %v\n", name, user, pass, port, newRoot, anonymous, writeAllowed)

	err = initServer(name, user, pass, port, newRoot, writeAllowed, anonymous)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = server.StartFTP()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	config.SendJSON(w, config.FTPServer.Conn.Addr()+":"+config.FTPServer.Port)
}

func initServer(name, user, pass, port, root, writeAllowed, anonymous string) error {
	var err error
	root = config.ResolveLocalPath(root)

	if !config.LocalFolderExists(root) {
		err = fmt.Errorf("\"%v\" folder does not exist", root)
		return err
	}

	if name == "" {
		return fmt.Errorf("name is required")
	}

	if strings.EqualFold(name, config.COMMONFTPNAME) {
		name = config.DefFTPServerName
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

	config.FTPServer.Name = name
	config.FTPServer.User = user
	config.FTPServer.Password = pass
	config.FTPServer.Port = port
	config.FTPServer.RootDir = root
	config.FTPServer.AnonymousAccessAllowed = isAnonymous
	config.FTPServer.WriteAllowed = writeAllowedBool
	return nil
}

package clienthandlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleConnectToServer(w http.ResponseWriter, req *http.Request) {
	host := req.FormValue("server_host")
	port := req.FormValue("server_port")
	user := req.FormValue("user")
	pass := req.FormValue("password")
	anonymous := req.FormValue("anonymous")
	isAnonymous := false

	if anonymous != "" {
		var err error
		isAnonymous, err = strconv.ParseBool(anonymous)
		if err != nil {
			err = fmt.Errorf("Invalid value for annonymous in form: %v", err.Error())
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	if isAnonymous {
		user = "anonymous"
		pass = "anonymous"
	}

	if host == "" || port == "" {
		http.Error(w, "server_host/server_port are required", http.StatusBadRequest)
		return
	}

	if user == "" || pass == "" {
		http.Error(w, "user/password are required", http.StatusBadRequest)
		return
	}

	addr := host + ":" + port
	err := client.AuthClient(user, pass, addr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	authUser = user
	authPass = pass
	authAddr = addr

	config.SendJSON(w, "successfully connected to server")
}

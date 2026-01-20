package main

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/server"
	"github.com/jlaffaye/ftp"
)

func handleConnectToServer(w http.ResponseWriter, req *http.Request) {
	host := req.FormValue("server_host")
	port := req.FormValue("server_port")
	user := req.FormValue("user")
	pass := req.FormValue("password")
	annonymous := req.FormValue("anonymous")
	isAnonymous := false

	if annonymous != "" {
		var err error
		isAnonymous, err = strconv.ParseBool(annonymous)
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
		http.Error(w, "host/port are required", http.StatusBadRequest)
		return
	}

	if user == "" || pass == "" {
		http.Error(w, "user/password are required", http.StatusBadRequest)
		return
	}

	addr := host + ":" + port
	err := client.AuthClient(addr, user, pass)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	sendJSON(w, "successfully connected to server")
}

func handleGetConnectedClients(w http.ResponseWriter, req *http.Request) {
	connClients := server.GetConnectedHosts()
	sendJSON(w, connClients)
}

func handleStreamFile(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	path := req.URL.Query().Get("path")
	if path == "" {
		err := fmt.Errorf("path is required")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	entry, err := c.GetEntry(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if entry.Type != ftp.EntryTypeFile {
		err := fmt.Errorf("Error: \"%v\" is not a file", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response, err := c.Retr(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer response.Close()

	fileName := filepath.Base(path)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	w.Header().Set("Content-Type", "application/octet-stream")

	_, err = io.Copy(w, response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- err.Error()
		return
	}
}

func handleListDir(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	//Get entry at path
	path := req.URL.Query().Get("path")
	entry, err := c.GetEntry(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- fmt.Sprintf("Error occured while reading \"%v\": %v", path, err)
		return
	}

	//Check if not folder
	if entry.Type != ftp.EntryTypeFolder {
		err := fmt.Errorf("Error: \"%v\" is not a directory", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		logsCh <- err.Error()
		return
	}

	//List directory
	entries, err := c.List(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- err.Error()
		return
	}

	//Store and send in json
	directory := Dir{}
	for _, entry := range entries {
		e := FSObject{
			Name: entry.Name,
		}
		if entry.Type == ftp.EntryTypeFolder {
			e.IsFolder = true
		} else {
			e.IsFolder = false
		}

		directory.Entries = append(directory.Entries, e)
	}

	sendJSON(w, directory)
}

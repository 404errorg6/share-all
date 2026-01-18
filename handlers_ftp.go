package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/jlaffaye/ftp"
)

func handleConnectClient(w http.ResponseWriter, req *http.Request) {
	user := req.URL.Query().Get("user")
	pass := req.URL.Query().Get("pass")
	svrAddr := req.URL.Query().Get("server_addr")

	if user == "" || pass == "" {
		err := fmt.Errorf("user/pass not provided")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if svrAddr == "" {
		err := fmt.Errorf("server_addr not provided")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := client.AuthClient(svrAddr, user, pass)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		logsCh <- err.Error()
		return
	}

	sendJSON(w, "successfully connected")
}

func handleFile(w http.ResponseWriter, req *http.Request) {
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

	f, err := os.Open(filepath.Join(root, path))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var buffer []byte
	_, err = f.Read(buffer)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = response.Read(buffer)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sendJSON(w, buffer)
}

func handleLS(w http.ResponseWriter, req *http.Request) {
	client.AuthClient(ftpHost+":"+ftpPort, "test", "test") //Auto auth for testing
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

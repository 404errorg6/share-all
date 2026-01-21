package serverhandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleListDir(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	//Get entry at path
	path := req.URL.Query().Get("path")
	entry, err := c.GetEntry(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		config.LogsCh <- fmt.Sprintf("Error occured while reading \"%v\": %v", path, err)
		return
	}

	//Check if not folder
	if entry.Type != ftp.EntryTypeFolder {
		err := fmt.Errorf("Error: \"%v\" is not a directory", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		config.LogsCh <- err.Error()
		return
	}

	//List directory
	entries, err := c.List(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		config.LogsCh <- err.Error()
		return
	}

	//Store and send in json
	directory := config.Dir{Entries: []config.FSObject{}} //Initialize to avoid null in json
	for _, entry := range entries {
		e := config.FSObject{
			Name: entry.Name,
		}
		if entry.Type == ftp.EntryTypeFolder {
			e.IsFolder = true
		} else {
			e.IsFolder = false
		}

		directory.Entries = append(directory.Entries, e)
	}

	config.SendJSON(w, directory)
}

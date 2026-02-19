package serverhandlers

import (
	"fmt"
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleListRemoteDir(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	//Get entry at remotePath
	remotePath := req.FormValue("remote_path")
	remotePath, entry, err := config.ResolveRemotePath(c, remotePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//Check if not folder
	if entry.Type != ftp.EntryTypeFolder {
		fmt.Printf("Type error: %v is type: %v\n", remotePath, entry.Type.String())
		err := fmt.Errorf("Error: \"%v\" is not a directory", remotePath)
		http.Error(w, err.Error(), http.StatusBadRequest)
		config.LogsCh <- err.Error()
		return
	}

	//List directory
	dir, err := c.List(remotePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		config.LogsCh <- err.Error()
		return
	}

	//Store and send in json
	dirObj := getDirObj(dir)
	config.SendJSON(w, dirObj)
}

func getDirObj(dir []*ftp.Entry) []config.FSObject {
	dirObj := []config.FSObject{}
	for _, entry := range dir {
		e := config.FSObject{
			Name:         entry.Name,
			LastModified: entry.Time,
			Size:         int(entry.Size),
		}

		if entry.Type == ftp.EntryTypeFolder {
			e.IsFolder = true
		} else {
			e.IsFolder = false
		}

		dirObj = append(dirObj, e)
	}

	return dirObj
}

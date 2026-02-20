package clienthandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/ftp/config"
)

func HandleTransfer(w http.ResponseWriter, req *http.Request) {
	var transfersArr []ProgressInfo
	for _, info := range transferMap {
		transfersArr = append(transfersArr, info)
	}

	config.SendJSON(w, transfersArr)
}

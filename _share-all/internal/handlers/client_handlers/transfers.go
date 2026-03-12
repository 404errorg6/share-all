package clienthandlers

import (
	"fmt"
	"net/http"

	"changeme/internal/config"
)

func HandleTransfer(w http.ResponseWriter, req *http.Request) {
	var transfersArr []TransferInfo
	transferMap.Range(func(key, val any) bool {
		info, ok := val.(TransferInfo)
		if !ok {
			config.LogsCh <- fmt.Sprintf("Unable to typecast to TransferInfo the value: %v", val)
			return true
		}

		transfersArr = append(transfersArr, info)
		return true
	})

	config.SendJSON(w, transfersArr)
}

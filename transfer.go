package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func sendJSON(w http.ResponseWriter, data any) {
	body, err := json.Marshal(data)
	if err != nil {
		logsCh <- fmt.Sprintf("Error sending JSON: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write([]byte(body))
	w.WriteHeader(200)
}


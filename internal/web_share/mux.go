package webshare

import (
	"net/http"
)

func MiniMux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", serveHTML)
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.HandlerFunc(serveAssets)))

	mux.HandleFunc("GET /api/ls", handleLS)
	mux.HandleFunc("GET /api/file", serveFile)
	mux.HandleFunc("POST /api/file", handleUploadToServer)

	return mux
}

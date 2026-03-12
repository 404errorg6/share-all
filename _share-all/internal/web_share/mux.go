package webshare

import (
	"net/http"
)

func MiniMux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", serveHTML)
	mux.HandleFunc("GET /assets/", serveAssets)

	mux.HandleFunc("GET /api/ls", handleLS)
	mux.HandleFunc("GET /file", serveFile)

	return mux
}

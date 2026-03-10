package httphandlers

import (
	"net/http"

	"github.com/404errorg6/FTP-server/config"
)

func init() {
	config.MiniServer.Conn.Handler = MiniMux()
}

func MiniMux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", serveHTML)
	mux.HandleFunc("GET /assets/", serveAssets)

	mux.HandleFunc("GET /api/ls", handleLS)
	mux.HandleFunc("GET /file", serveFile)

	return mux
}

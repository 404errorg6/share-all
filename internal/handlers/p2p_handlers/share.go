package p2phandlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/404errorg6/share-all/internal/config"
)

func HandleConfigureShare(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.FormValue("name"))
	rootDir := req.FormValue("server_root_dir")
	writeAllowedRaw := req.FormValue("write_allowed")
	writeAllowed := true
	if writeAllowedRaw != "" {
		parsed, err := strconv.ParseBool(writeAllowedRaw)
		if err != nil {
			http.Error(w, fmt.Sprintf("invalid write_allowed value: %v", err), http.StatusBadRequest)
			return
		}
		writeAllowed = parsed
	}

	if err := config.P2PShare.Configure(name, rootDir, writeAllowed); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	config.SendJSON(w, config.P2PShare.Snapshot())
}

func HandleShareStatus(w http.ResponseWriter, req *http.Request) {
	config.SendJSON(w, config.P2PShare.Snapshot())
}

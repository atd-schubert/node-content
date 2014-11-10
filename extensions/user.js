"use strict";

/*
	
	Die User Verwaltung sollte als erstes gestartet werden und realsiert über Passport
	alle wichtigen Benutzer daten in den requst mit aufnehmen
	
	in einem zweiten Schritt sollten dann explizit verbotene Pfade herausgefiltert werden
	und eine 403 Forbidden Page als Antwort bekommen... oder alternativ eine loginseite, die nicht benötigt die
	Url zu wechseln, sodass nach login ein reffer auf die eigentlich url nicht mehr nötig ist.
	
	Außerdem sollten gundsätzliches Sessions angeboten werden, oder dies ggf. augelagert werden.
	
	außerdem sollen zu einem reqest die folgenden funtionen durch diese ext abgerufen werden:
	isUser(req, ["name"]),
	isGroup(req, ["admin", "editors"]);
	
*/
#!/usr/bin/env python3
"""Validate and minimally transform public school-published roster facts for 2026.

Primary source: 2026 cfbfastR-data CFBD-derived roster CSV.
Optional newer source: ncaapyscraper weekly release (parsed from ZIP, no extraction).
Only names and football positions are used; never scrape photos/bios/phone numbers.
Position is NOT evidence of starter status, participation, or projected performance.
"""
import argparse
import csv
import json
import re
import zipfile
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
from import_season_schedules import team_id

ALLOWED_POS={"QB","RB","HB","FB","WR","TE","K","PK","P","OL","OT","OG","C","DL","DE","DT","LB","ILB","OLB","CB","S","FS","SS","DB","LS","ATH"}
MAX_BYTES=15_000_000
MAX_ZIP_BYTES=150_000_000
MAX_MEMBERS=3000
MAX_SCHOOL_JSON=1_500_000
MAX_PLAYERS=240


def clean_name(name):
    name=" ".join(str(name or "").split())
    return name if 3 <= len(name) <= 90 and not re.search(r"[<>\x00-\x1f]",name) and not name.startswith(("=", "+", "-", "@")) else None


def position(raw):
    p=str(raw or "").upper().strip().replace(" ", "")
    if p in ALLOWED_POS:return p
    if p in ("RUNNINGBACK","RUNNINGBACKS"):return "RB"
    if p in ("WIDERECEIVER","WIDERECEIVERS"):return "WR"
    if p in ("QUARTERBACK","QUARTERBACKS"):return "QB"
    if p in ("TIGHTEND","TIGHTENDS"):return "TE"
    if p.startswith("OFFENSIVELINE"):return "OL"
    return None


def with_school_mapping(s, supported):
    slug=team_id(str(s or ""))
    if slug in supported:return slug
    aliases={"miami-ohio":"miami-oh","university-of-miami":"miami","university-of-mississippi":"ole-miss","mississippi":"ole-miss","texas-aandm":"texas-am","texas-a-m":"texas-am","hawai-i":"hawaii","appalachian-state":"app-state","university-of-connecticut":"uconn","california-berkeley":"california","san-jose-state-university":"san-jose-state","north-carolina-state":"nc-state","university-of-central-florida":"ucf","southern-methodist":"smu","louisiana-monroe":"ul-monroe","university-of-louisiana-monroe":"ul-monroe","southern-mississippi":"southern-miss","u-mass":"massachusetts","umass":"massachusetts","pitt":"pittsburgh"}
    return aliases.get(slug) if aliases.get(slug) in supported else None


def cfbd_roster(path, supported):
    p=Path(path)
    if not p.is_file() or p.stat().st_size>MAX_BYTES:raise ValueError("Missing or oversized CFBD roster")
    result=defaultdict(list)
    with p.open(encoding="utf-8-sig",newline="") as file:
        reader=csv.DictReader(file)
        if not {"team","position"}.issubset(set(reader.fieldnames or [])):
            raise ValueError("Unexpected roster CSV schema")
        for row in reader:
            id=with_school_mapping(row.get("team"),supported)
            if not id:continue
            name=clean_name(row.get("name") or row.get("full_name") or " ".join((row.get("first_name") or "",row.get("last_name") or "")))
            pos=position(row.get("position"))
            if name and pos:result[id].append({"name":name,"position":pos})
    return result


def newer_archive(path, supported):
    p=Path(path)
    if not p.is_file() or p.stat().st_size>MAX_ZIP_BYTES:raise ValueError("Missing/oversized weekly release")
    out=defaultdict(list)
    count=0
    with zipfile.ZipFile(path) as archive:
        entries=archive.infolist()
        if len(entries)>MAX_MEMBERS:raise ValueError("Too many archive members")
        for item in entries:
            if not item.filename.lower().endswith('.json') or item.file_size>MAX_SCHOOL_JSON or item.file_size<10:continue
            # Never extract entries: parse only bounded member bytes.
            if item.filename.endswith('index.json'):continue
            try:
                with archive.open(item) as fh:doc=json.loads(fh.read(MAX_SCHOOL_JSON+1))
            except (ValueError,OSError,UnicodeError):continue
            if not isinstance(doc,dict):continue
            key=doc.get("key")
            school=with_school_mapping(key,supported) or with_school_mapping(doc.get("school"),supported)
            if not school:continue
            if str(doc.get("subdivision","")).casefold() not in ("fbs","1-fbs","division i fbs"):
                continue
            for sport in doc.get("sports",[]):
                if str(sport.get("sport","")).lower() not in ("football","mens-football"):continue
                if str(sport.get("season", "2026"))[:4]!="2026":continue
                for player in sport.get("players",[])[:MAX_PLAYERS]:
                    n=clean_name(player.get("name") or " ".join((player.get("first_name") or "",player.get("last_name") or "")))
                    pos=position(player.get("position"))
                    if n and pos:out[school].append({"name":n,"position":pos})
            count+=1
    return out,count


def build(schedule,cfbd,weekly=None):
    meta=json.loads(Path(schedule).read_text())
    if meta.get("season")!=2026 or meta.get("schemaVersion")!=1:raise ValueError("Invalid 2026 schedule reference")
    supported={x["id"] for x in meta["teams"]}
    older=cfbd_roster(cfbd,supported)
    newer,member_count=(newer_archive(weekly,supported) if weekly and Path(weekly).is_file() else ({},0))
    output={}
    for id in sorted(supported):
        # Prefer newer weekly school rosters where complete enough; never stitch two
        # different player sets together and imply they are a single point-in-time roster.
        people = newer.get(id) if len(newer.get(id,[])) >= 25 else older.get(id,[])
        seen=set();rows=[]
        for p in people:
            k=p["name"].casefold()
            if k not in seen and len(rows)<MAX_PLAYERS:
                seen.add(k);rows.append(p)
        if rows:output[id]=sorted(rows,key=lambda x:(x["position"],x["name"].casefold()))
    if len(output)<70:
        raise ValueError(f"Insufficient recognized FBS rosters: {len(output)}")
    return {"schemaVersion":1,"season":2026,"kind":"roster-snapshot-not-starter-or-availability-chart",
        "sourceUrl":"https://github.com/sportsdataverse/cfbfastR-data",
        "supplementalSourceUrl":"https://github.com/fakhar-ud-din/ncaapyscraper/releases/latest" if member_count else None,
        "published":datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sourceDates":"2026 roster data; individual school snapshot ages differ; check individual school for transfers/injuries",
        "totalPlayers":sum(map(len,output.values())),"schoolsCount":len(output),"weeklyMembersParsed":member_count,
        "schools":output,
        "notice":"Full names are roster-listed, not proof of starting status or playing time. Any generated props are synthetic and uncalibrated. No photographs or NIL rights included."}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--schedule",required=True)
    p.add_argument("--cfbd-roster",required=True)
    p.add_argument("--weekly-zip")
    p.add_argument("--out",required=True)
    a=p.parse_args()
    data=build(a.schedule,a.cfbd_roster,a.weekly_zip)
    dest=Path(a.out);dest.parent.mkdir(exist_ok=True,parents=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"),sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:data[k] for k in ('season','schoolsCount','totalPlayers','weeklyMembersParsed')}))

if __name__=='__main__':main()

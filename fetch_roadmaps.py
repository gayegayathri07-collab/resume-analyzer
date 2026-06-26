import json, os, sys, re, time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

API_BASE = "https://roadmap.sh/api/v1-official-roadmap"
SAMPLES_DIR = Path(__file__).resolve().parent / "samples"

ROADMAPS_TO_FETCH = [
    # Role-based roadmaps
    "frontend", "backend", "devops", "full-stack", "data-analyst",
    "ai-engineer", "ai-data-scientist", "data-engineer", "machine-learning",
    "devsecops", "android", "postgresql-dba", "ios", "blockchain", "qa",
    "software-architect", "cyber-security", "ux-design", "technical-writer",
    "game-developer", "server-side-game-developer", "mlops", "product-manager",
    "engineering-manager", "bi-analyst", "network-engineer",
    # Skill-based roadmaps
    "python", "python-data-analysis", "sql", "react", "vue", "angular",
    "javascript", "typescript", "nodejs", "system-design", "java", "aspnet-core",
    "api-design", "spring-boot", "flutter", "cpp", "rust", "golang",
    "design-architecture", "graphql", "react-native", "design-system",
    "prompt-engineering", "mongodb", "linux", "kubernetes", "docker", "aws",
    "terraform", "data-structures-and-algorithms", "redis", "git-github",
    "php", "nextjs", "code-review", "kotlin", "html", "css", "django",
    "ruby", "ruby-on-rails", "scala", "swift",
]

def fetch_roadmap_data(slug):
    url = f"{API_BASE}/{slug}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except URLError as e:
        print(f"  Failed: {e}")
        return None
    except json.JSONDecodeError:
        print(f"  Failed to parse JSON")
        return None

def clean_label(label):
    return re.sub(r'\s+', ' ', label).strip()

def slug_to_name(slug):
    return slug.replace("-", " ").replace("_", " ").title()

def process_roadmap(data):
    if not data or "nodes" not in data:
        return None

    nodes = data["nodes"]
    edges = data.get("edges", [])

    node_map = {n["id"]: n for n in nodes}

    topic_subtopics = {}
    learning_sequence = []

    edge_node_ids = {e["source"] for e in edges} | {e["target"] for e in edges}

    topics = [n for n in nodes if n.get("type") == "topic" and n.get("data", {}).get("label")]
    subtopics = [n for n in nodes if n.get("type") == "subtopic" and n.get("data", {}).get("label")]

    for n in topics:
        topic_subtopics.setdefault(n["id"], {"topic": clean_label(n["data"]["label"]), "items": []})

    for edge in edges:
        src = node_map.get(edge["source"])
        tgt = node_map.get(edge["target"])
        if not src or not tgt:
            continue
        if src.get("type") == "topic" and tgt.get("type") == "subtopic":
            tid = src["id"]
            topic_subtopics.setdefault(tid, {"topic": clean_label(src["data"]["label"]), "items": []})
            if clean_label(tgt["data"]["label"]) not in [i["label"] for i in topic_subtopics[tid]["items"]]:
                topic_subtopics[tid]["items"].append({
                    "label": clean_label(tgt["data"]["label"]),
                    "id": tgt["id"],
                })

    solid_edges = [e for e in edges if e.get("data", {}).get("edgeStyle") == "solid" or "dash" not in str(e.get("style", ""))]
    visited = set()
    for edge in solid_edges:
        src = node_map.get(edge["source"])
        if src and src.get("type") == "topic":
            tid = src["id"]
            if tid not in visited and tid in topic_subtopics:
                learning_sequence.append(topic_subtopics[tid])
                visited.add(tid)

    for t in topics:
        tid = t["id"]
        if tid not in visited and tid in topic_subtopics:
            learning_sequence.append(topic_subtopics[tid])
            visited.add(tid)

    subtopic_labels = sorted(set(clean_label(n["data"]["label"]) for n in subtopics))

    title = data.get("title", {})
    card_title = slug_to_name(data.get("slug", ""))
    if isinstance(title, dict):
        card_title = title.get("card") or title.get("page") or card_title
    elif isinstance(title, str):
        card_title = title

    result = {
        "slug": data.get("slug", ""),
        "title": card_title,
        "description": data.get("description", "").replace("@currentYear@", "2026"),
        "type": data.get("type", "role"),
        "total_topics": len(topics),
        "total_subtopics": len(subtopics),
        "learning_sequence": learning_sequence,
        "subtopics_list": subtopic_labels,
        "source": f"https://roadmap.sh/{data.get('slug', '')}",
        "created_at": data.get("createdAt", ""),
        "updated_at": data.get("updatedAt", ""),
    }
    return result


def main():
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    success = 0
    failed = 0

    print("Fetching roadmaps from roadmap.sh...")
    print(f"Saving to: {SAMPLES_DIR}\n")

    for slug in ROADMAPS_TO_FETCH:
        json_path = SAMPLES_DIR / f"{slug}.json"
        if json_path.exists():
            print(f"  {slug} -- already exists, skipping")
            continue

        print(f"  Fetching {slug}...", end=" ")
        sys.stdout.flush()

        data = fetch_roadmap_data(slug)
        if not data:
            print("SKIP (no data)")
            failed += 1
            continue

        processed = process_roadmap(data)
        if not processed:
            print("SKIP (processing failed)")
            failed += 1
            continue

        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            topic_count = len(processed.get("learning_sequence", []))
            subtopic_count = len(processed.get("subtopics_list", []))
            print(f"OK ({topic_count} topics, {subtopic_count} subtopics)")
            success += 1
        except Exception as e:
            print(f"ERROR: {e}")
            failed += 1

        time.sleep(0.3)

    print(f"\nDone! {success} roadmaps fetched successfully, {failed} failed.")

    existing = sorted(SAMPLES_DIR.glob("*.json"))
    print(f"\nTotal roadmaps in samples/: {len(existing)}")
    for f in existing:
        size = f.stat().st_size
        print(f"  {f.name} ({size} bytes)")


if __name__ == "__main__":
    main()

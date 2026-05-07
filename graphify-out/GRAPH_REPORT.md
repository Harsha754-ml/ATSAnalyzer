# Graph Report - resume project  (2026-05-06)

## Corpus Check
- 29 files · ~15,875 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 105 nodes · 122 edges · 9 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `Collection` - 15 edges
2. `analyzeResume()` - 13 edges
3. `detectSections()` - 3 edges
4. `buildTemplate()` - 3 edges
5. `compareResumeToTemplate()` - 3 edges
6. `uploadResume()` - 3 edges
7. `run()` - 3 edges
8. `generateToken()` - 3 edges
9. `extractSkills()` - 3 edges
10. `extractProjects()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `uploadResume()` --calls--> `analyzeResume()`  [INFERRED]
  backend\controllers\resume.controller.js → backend\utils\resumeAnalyzer.js
- `signup()` --calls--> `generateToken()`  [INFERRED]
  backend\controllers\auth.controller.js → backend\utils\jwt.js
- `login()` --calls--> `generateToken()`  [INFERRED]
  backend\controllers\auth.controller.js → backend\utils\jwt.js
- `handleTemplateUpload()` --calls--> `uploadAtsTemplate()`  [INFERRED]
  src\App.tsx → src\services\geminiService.ts
- `handleResumeUpload()` --calls--> `compareResume()`  [INFERRED]
  src\App.tsx → src\services\geminiService.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (1): Collection

### Community 1 - "Community 1"
Cohesion: 0.31
Nodes (12): analyzeResume(), calculateScore(), extractCertifications(), extractEducation(), extractEmails(), extractExperience(), extractLinks(), extractName() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.19
Nodes (7): ThreeBackground(), useTheme(), compareResume(), parseJsonResponse(), uploadAtsTemplate(), handleResumeUpload(), handleTemplateUpload()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (5): buildSuggestions(), buildTemplate(), compareResumeToTemplate(), detectSections(), extractKeywords()

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (3): login(), signup(), generateToken()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (2): extractText(), uploadResume()

### Community 8 - "Community 8"
Cohesion: 0.83
Nodes (3): log(), request(), run()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): handleChange(), playHapticFeedback()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (1): cn()

## Knowledge Gaps
- **Thin community `Community 0`** (16 nodes): `jsonDb.js`, `Collection`, `.constructor()`, `.create()`, `._ensureFile()`, `.find()`, `.findById()`, `.findByIdAndDelete()`, `.findByIdAndUpdate()`, `.findOne()`, `.findOneAndDelete()`, `.findOneAndUpdate()`, `.findSorted()`, `._genId()`, `._read()`, `._write()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (6 nodes): `resume.controller.js`, `analyzeLatest()`, `deleteResume()`, `extractText()`, `getHistory()`, `uploadResume()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (3 nodes): `material-design-3-switch.tsx`, `handleChange()`, `playHapticFeedback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (3 nodes): `cn()`, `utils.ts`, `utils.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyzeResume()` connect `Community 1` to `Community 7`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `uploadResume()` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
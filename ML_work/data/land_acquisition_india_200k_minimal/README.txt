SYNTHETIC DATASET — NOT REAL GOVERNMENT RECORDS

200,000 India-wide synthetic land-acquisition project records.
The schema intentionally contains only the requested features plus project ID and prediction targets.

Features:
project_type, land_area_hectares, number_of_affected_families, compensation_status,
approval_timeline_days, legal_disputes_count, possession_status, rehabilitation_progress_pct,
stakeholder_responsiveness, historical_performance_score, administrator_id, manager, location,
altitude_m, longitude.

Targets:
delay_status, delay_days, risk_score.

All 36 Indian States/UTs are represented. State/district names are real geographic labels, but
the project records, IDs and coordinates are synthetic. Longitude/altitude are approximate synthetic
project-level values and must not be presented as cadastral coordinates.

Class distribution is approximately 32% Delayed / 68% On Time. This is a modelling choice, NOT
a claim that 32% is India's true national delay rate.

The synthetic generator creates dependencies between features: larger land areas generally affect
more families; project complexity affects approvals; legal disputes and compensation friction affect
delay; weaker rehabilitation/stakeholder responsiveness and lower historical performance increase risk.

For ML, exclude delay_status, delay_days and risk_score from X when they are the prediction target.
Treat administrator_id and manager as identifiers rather than ordinary numeric features to avoid
memorization. Use a stratified split and also test state-held-out generalization.

Research basis: the SIH problem statement requires project type, land area, affected families,
compensation, approvals, legal disputes, possession, rehabilitation, stakeholder responsiveness
and historical performance. Public Indian systems such as Bhoomi Rashi, RailBhoomi and DoLR/LARR MIS
were used as conceptual calibration sources in the research; no government record was copied into
this synthetic dataset.

FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
COPY app.html index.html server.js ./
COPY assets ./assets
COPY auth ./auth
COPY "AI assistant" "./AI assistant"
COPY carnet_de_dettes ./carnet_de_dettes
COPY console_origin_ai_syst_me_pigm ./console_origin_ai_syst_me_pigm
COPY dashboard_cl_ture_de_caisse ./dashboard_cl_ture_de_caisse
COPY dashboard_fournisseurs_achats ./dashboard_fournisseurs_achats
COPY dashboard_gestion_des_d_penses ./dashboard_gestion_des_d_penses
COPY dashboard_inventaire_physique_audit ./dashboard_inventaire_physique_audit
COPY dashboard_propri_taire_erp_retail_1 ./dashboard_propri_taire_erp_retail_1
COPY dashboard_propri_taire_erp_retail_2 ./dashboard_propri_taire_erp_retail_2
COPY gestion_des_stocks_multi_boutiques ./gestion_des_stocks_multi_boutiques
COPY interface_de_caisse_tactile_pos ./interface_de_caisse_tactile_pos
COPY journal_d_audit_s_curit_immuable ./journal_d_audit_s_curit_immuable
COPY param_tres_syst_me_erp_retail ./param_tres_syst_me_erp_retail
COPY pragmatic_local_intelligence ./pragmatic_local_intelligence
COPY tableau_de_bord_gestionnaire_de_boutique ./tableau_de_bord_gestionnaire_de_boutique
COPY tableau_de_bord_sauvegarde_restauration ./tableau_de_bord_sauvegarde_restauration

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]

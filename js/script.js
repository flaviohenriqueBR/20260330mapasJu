//
// ==============================
// CONFIGURAÇÃO GLOBAL
// ==============================
//

let breaks = [];
let cores = [];
let numClasses = 3;
let paletaAtual = "Reds";

let mapa;
let camadaGeojson;

let cidadeAtual = "americana";

const indicadoresDisponiveis = [
    "moradores",
    "perc_mulheres",
    "perc_jovens",
    "renda_media",
    "1212_DEPUTADO_FEDERAL",
    "13133_DEPUTADO_ESTADUAL",
    "1313_DEPUTADO_FEDERAL",
    "1319_DEPUTADO_FEDERAL",
    "13900_DEPUTADO_ESTADUAL",
    "13_DEPUTADO_ESTADUAL",
    "13_DEPUTADO_FEDERAL",
    "1818_DEPUTADO_FEDERAL",
    "4040_DEPUTADO_FEDERAL",
    "50000_DEPUTADO_ESTADUAL",
    "50005_DEPUTADO_ESTADUAL",
    "5000_DEPUTADO_FEDERAL",
    "5010_DEPUTADO_FEDERAL",
    "50110_DEPUTADO_ESTADUAL",
    "5021_DEPUTADO_FEDERAL",
    "50789_DEPUTADO_ESTADUAL",
    "5089_DEPUTADO_FEDERAL",
    "50_DEPUTADO_ESTADUAL",
    "50_DEPUTADO_FEDERAL"
];

const zoomExtraPorCidade = {
    "campinas": 1,
    "americana": 1,
    "limeira": 1,
    "piracicaba": 1,
    "guarulhos": 1,
    "franca": 1,
    "jundiaí": 1,
    "indaiatuba": 1,
    "paulínia": 1,
    "sorocaba": 1,
    "são paulo1": 0,
    "são paulo2": 0
};

let indicadorAtual = indicadoresDisponiveis[0];

let dadosGeo = null;
//
// ==============================
// MAPA
// ==============================
//

function iniciarMapa() {

    mapa = L.map("map").setView([-22.73, -47.33], 12);

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            crossOrigin: true
        }
    ).addTo(mapa);

}

//
// ==============================
// CARREGAR GEOJSON
// ==============================
//

async function carregarGeojson() {

    const resposta =
        await fetch(`data/${cidadeAtual}.geojson`);

    dadosGeo = await resposta.json();

    desenharMapa();

}

//
// ==============================
// JENKS
// ==============================
//

function calcularJenks(valores, n) {

    const valoresUnicos =
        [...new Set(valores)];

    const classes =
        Math.min(n, valoresUnicos.length);

    return ss.jenks(valores, classes);

}

//
// ==============================
// CORES
// ==============================
//

function gerarCores(n) {
    return chroma.scale(paletaAtual).colors(n);
}

function getCor(valor) {

    if (valor === null || valor === undefined) {
        return "#cccccc";
    }

    for (let i = 0; i < breaks.length - 1; i++) {

        if (
            valor >= breaks[i] &&
            valor <= breaks[i + 1]
        ) {
            return cores[i];
        }

    }

    return cores[cores.length - 1];

}

//
// ==============================
// DESENHAR MAPA
// ==============================
//

function desenharMapa() {

    if (!dadosGeo) return;

    if (camadaGeojson) {
        mapa.removeLayer(camadaGeojson);
    }

    const valores = dadosGeo.features
        .map(f => f.properties[indicadorAtual])
        .filter(v => v !== null && v !== undefined);

    breaks = calcularJenks(
        valores,
        numClasses
    );

    cores = gerarCores(
        breaks.length - 1
    );

    camadaGeojson = L.geoJSON(dadosGeo, {

        style: function (feature) {

            const valor =
                feature.properties[indicadorAtual];

            return {
                color: "#555",
                weight: 1,
                fillOpacity: 0.7,
                fillColor: getCor(valor)
            };

        },

        onEachFeature: function (
            feature,
            layer
        ) {

            layer.bindPopup(`
                <b>${feature.properties.locais_agregados || "Local"}</b><br>
                ${indicadorAtual}: ${
                    Number(feature.properties[indicadorAtual]).toFixed(2)
                }
            `);

        }

    }).addTo(mapa);

    enquadrarMapa();

    criarLegenda();

}

function enquadrarMapa() {

    if (!camadaGeojson) return;


    const bounds =
        camadaGeojson.getBounds();


    mapa.fitBounds(
        bounds,
        {
            padding: [50,50],
            animate:false
        }
    );

}

//
// ==============================
// LEGENDA
// ==============================
//

function criarLegenda() {

    const old =
        document.getElementById("legend");

    if (old) {
        old.remove();
    }

    let legend = L.control({
        position: "bottomright"
    });

    legend.onAdd = function () {

        let div =
            L.DomUtil.create(
                "div",
                "info legend"
            );

        div.id = "legend";

        for (
            let i = 0;
            i < breaks.length - 1;
            i++
        ) {

            div.innerHTML += `
                <div>
                    <i style="
                        background:${cores[i]};
                        width:18px;
                        height:18px;
                        display:inline-block;
                        margin-right:6px;
                    "></i>
                    ${breaks[i].toFixed(3)}
                    –
                    ${breaks[i + 1].toFixed(3)}
                </div>
            `;

        }

        return div;

    };

    legend.addTo(mapa);

}

//
// ==============================
// INDICADORES
// ==============================
//

function carregarIndicadores() {

    const select =
        document.getElementById("indicador");

    select.innerHTML = "";

    indicadoresDisponiveis.forEach(ind => {

        const opt =
            document.createElement("option");

        opt.value = ind;
        opt.textContent = ind;

        select.appendChild(opt);

    });

    indicadorAtual =
        indicadoresDisponiveis[0];

}

function nomeCidadeFormatado() {

    const select =
        document.getElementById("cidade");

    return select.options[
        select.selectedIndex
    ].text;

}
const nomesIndicadores = {
    moradores: "Moradores",
    perc_mulheres: "% Mulheres",
    perc_jovens: "% Jovens",
    renda_media: "Renda Média"
};

function nomeIndicadorFormatado() {

    return nomesIndicadores[indicadorAtual]
        || indicadorAtual;

}

///
// ==============================
// EXPORTAR JPEG
// ==============================
//

//
// ==============================
// INIT
// ==============================
//

document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarMapa();

        carregarIndicadores();

        carregarGeojson();

        document
            .getElementById("indicador")
            .addEventListener(
                "change",
                function (e) {

                    indicadorAtual =
                        e.target.value;

                    desenharMapa();

                }
            );

        document
            .getElementById("cidade")
            .addEventListener(
                "change",
                function (e) {

                    cidadeAtual =
                        e.target.value;

                    carregarGeojson();

                }
            );

        document
            .getElementById("classes")
            .addEventListener(
                "change",
                function (e) {

                    numClasses =
                        +e.target.value;

                    desenharMapa();

                }
            );

        document
            .getElementById("paleta")
            .addEventListener(
                "change",
                function (e) {

                    paletaAtual =
                        e.target.value;

                    desenharMapa();

                }
            );

        document
            .getElementById("baixarMapa")
            .addEventListener(
                "click",
                baixarMapaJPEG
            );

        document
    .getElementById("baixarPDF")
    .addEventListener(
        "click",
        baixarMapaPDF
    );

    }
);

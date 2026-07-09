//
// =====================================
// EXPORTAÇÃO EM ALTA RESOLUÇÃO
// =====================================
//

function calcularBoundingBox(geojson){

    let minX = Infinity;
    let minY = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;

    function percorrer(coords){

        if(typeof coords[0] === "number"){

            const x = coords[0];
            const y = coords[1];

            if(x < minX) minX = x;
            if(x > maxX) maxX = x;

            if(y < minY) minY = y;
            if(y > maxY) maxY = y;

        }else{

            coords.forEach(percorrer);

        }

    }

    geojson.features.forEach(f=>{

        percorrer(f.geometry.coordinates);

    });

    return {

        minX,
        minY,
        maxX,
        maxY

    };

}

function projetar(x,y,bbox,escala,margem,altura){

    return {

        x:
            margem +
            (x-bbox.minX)*escala,

        y:
            altura-
            margem-
            (y-bbox.minY)*escala

    };

}

function desenharAnel(ctx,anel,bbox,escala,margem,altura){

    anel.forEach((coord,i)=>{

        const p =
            projetar(
                coord[0],
                coord[1],
                bbox,
                escala,
                margem,
                altura
            );

        if(i===0){

            ctx.moveTo(
                p.x,
                p.y
            );

        }else{

            ctx.lineTo(
                p.x,
                p.y
            );

        }

    });

}
function desenharPoligono(ctx,feature,bbox,escala,margem,altura){

    const cor =
        getCor(
            feature.properties[indicadorAtual]
        );

    ctx.beginPath();

    const geom =
        feature.geometry;

    if(
        geom.type==="Polygon"
    ){

        geom.coordinates.forEach(anel=>{

            desenharAnel(
                ctx,
                anel,
                bbox,
                escala,
                margem,
                altura
            );

        });

    }

    if(
        geom.type==="MultiPolygon"
    ){

        geom.coordinates.forEach(pol=>{

            pol.forEach(anel=>{

                desenharAnel(
                    ctx,
                    anel,
                    bbox,
                    escala,
                    margem,
                    altura
                );

            });

        });

    }

    ctx.fillStyle = cor;

    ctx.fill();

    ctx.strokeStyle="#666";

    ctx.lineWidth=1;

    ctx.stroke();

}

//
// =====================================
// DESENHAR MAPA
// =====================================
//

async function gerarMapaCanvas() {

    if (!dadosGeo) return;

    // -----------------------
    // CONFIGURAÇÃO
    // -----------------------

    const largura = 3200;
const altura = 2200;

const margem = 80;

// Espaço reservado para título
const cabecalho = 180;

// Espaço reservado para rodapé
const rodape = 80;

// Largura da coluna da legenda
const legenda = 550;

    const canvas = document.createElement("canvas");

    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext("2d");

    // Fundo branco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);

    // -----------------------
    // Bounding Box
    // -----------------------

    const bbox =
        calcularBoundingBox(dadosGeo);

    const larguraMapa =
    largura - legenda - margem * 2;

const alturaMapa =
    altura - cabecalho - rodape - margem * 2;

const escalaX =
    larguraMapa /
    (bbox.maxX - bbox.minX);

const escalaY =
    alturaMapa /
    (bbox.maxY - bbox.minY);

    const escala =
        Math.min(
            escalaX,
            escalaY
        );

   // -----------------------
// Centralizar mapa
// -----------------------

const larguraDesenhada =
    (bbox.maxX - bbox.minX) * escala;

const alturaDesenhada =
    (bbox.maxY - bbox.minY) * escala;

const offsetX =
    margem +
    (larguraMapa - larguraDesenhada) / 2;

const offsetY =
    cabecalho +
    margem +
    (alturaMapa - alturaDesenhada) / 2;

    // -----------------------
    // Redefine projeção
    // -----------------------

    function proj(x, y) {

        return {

            x:
                offsetX +
                (x - bbox.minX) * escala,

            y:
                altura -
                offsetY -
                (y - bbox.minY) * escala

        };

    }

    function desenharAnelExport(anel) {

        anel.forEach((coord, i) => {

            const p =
                proj(
                    coord[0],
                    coord[1]
                );

            if (i === 0)
                ctx.moveTo(p.x, p.y);

            else
                ctx.lineTo(p.x, p.y);

        });

    }

    // -----------------------
    // Desenha polígonos
    // -----------------------

    dadosGeo.features.forEach(feature => {

        ctx.beginPath();

        if (
            feature.geometry.type === "Polygon"
        ) {

            feature.geometry.coordinates.forEach(
                desenharAnelExport
            );

        }

        if (
            feature.geometry.type === "MultiPolygon"
        ) {

            feature.geometry.coordinates.forEach(pol => {

                pol.forEach(
                    desenharAnelExport
                );

            });

        }

        ctx.fillStyle =
            getCor(
                feature.properties[indicadorAtual]
            );

        ctx.fill();

        ctx.strokeStyle = "#777";

        ctx.lineWidth = 1.2;

        ctx.stroke();

    });

    // -----------------------
    // TÍTULO
    // -----------------------

    ctx.fillStyle = "#111";

    ctx.font = "bold 56px Arial";

    ctx.font = "bold 60px Arial";
ctx.fillStyle = "#111";

ctx.fillText(
   `${nomeCidadeFormatado()} - 2022`,
    margem,
    100
);

ctx.font = "36px Arial";

ctx.fillStyle = "#555";

ctx.fillText(
    "Indicador: " + nomeIndicadorFormatado(),
    margem,
    150
);
    // -----------------------
    // LEGENDA
    // -----------------------

const legendaX = largura - legenda + 60;
    let legendaY = cabecalho;

    ctx.fillStyle = "#000";
    ctx.font = "bold 38px Arial";
    ctx.fillText("Legenda", legendaX, legendaY);

    legendaY += 40;

    ctx.font = "30px Arial";

    for (let i = 0; i < breaks.length - 1; i++) {

        ctx.fillStyle = cores[i];

        ctx.fillRect(
            legendaX,
            legendaY,
            36,
            36
        );

        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            legendaX,
            legendaY,
            36,
            36
        );

        ctx.fillStyle = "#000";

        ctx.fillText(
            `${breaks[i].toFixed(2)} – ${breaks[i + 1].toFixed(2)}`,
            legendaX + 55,
            legendaY + 28
        );

        legendaY += 55;

    }

    // -----------------------
    // MOLDURA
    // -----------------------

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        margem / 2,
        margem / 2,
        largura - margem,
        altura - margem
    );

    // -----------------------
    // EXPORTAÇÃO
    // -----------------------

    const link =
        document.createElement("a");

    link.download =
        `${cidadeAtual}_${indicadorAtual}.png`;

    link.href =
        canvas.toDataURL("image/png");

    return canvas;

}

async function baixarMapaPDF() {

    if (!dadosGeo) return;

    // cria a imagem usando a mesma exportação do PNG
    const canvas = await gerarMapaCanvas();

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        5,
        5,
        287,
        200
    );

    pdf.save(
        `${cidadeAtual}_${indicadorAtual}.pdf`
    );

}

async function baixarMapaJPEG(){

    const canvas = await gerarMapaCanvas();

    const link = document.createElement("a");

    link.download =
        `${cidadeAtual}_${indicadorAtual}.png`;

    link.href =
        canvas.toDataURL("image/png");

    link.click();

}
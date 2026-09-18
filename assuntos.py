"""Assuntos mais específicos para categorias antigas muito genéricas.

As regras usam pistas no enunciado. Rótulos específicos alterados pelo estudante
permanecem intactos; resultados automáticos podem ser revisados depois.
"""
import re
import unicodedata

GENERIC = {
    'Matemática': {'Matemática'},
    'Língua Portuguesa': {'Interpretação e gramática'},
    'Informática': {'Informática básica'},
    'Equipamentos Mecânicos e Máquinas Térmicas': {'Equipamentos e calor'},
    'Metrologia e Instrumentação': {'Metrologia e Instrumentação'},
    'Materiais, Metalurgia e Ensaios': {'Materiais e tratamentos', 'Ensaios e propriedades'},
}


def plain(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.lower()) if not unicodedata.combining(c))


def matches(text, pattern):
    return bool(re.search(pattern, text, re.I))


def classify(macro, micro, statement):
    if micro not in GENERIC.get(macro, ()):
        return micro
    s = plain(statement)
    if macro == 'Língua Portuguesa':
        rules = [
            (r'crase|acent[o-u]a[cç]ao|acento indicativo', 'Crase e acentuação'),
            (r'ortograf|grafad|hifen|novo acordo|acordo ortograf', 'Ortografia'),
            (r'concordanc', 'Concordância verbal e nominal'),
            (r'regenc|transitiv|preposic', 'Regência verbal e nominal'),
            (r'colocac[aã]o pronominal|proclise|enclise|mesoclise|pronome', 'Pronomes e colocação'),
            (r'pontuac|virgula|sinal de pontuac', 'Pontuação'),
            (r'plural|flexao|formac[aã]o (?:das? )?palavra|partic[ií]pio|verbo|forma verbal', 'Morfologia e verbos'),
            (r'conjun[cç]|conectiv|orac[aã]o|periodo composto', 'Sintaxe e conectivos'),
            (r'coerenc|coes[aã]o|reescrev|reescrit|substituic', 'Coesão e reescrita'),
            (r'sin[oô]nim|antonim|paronim|sentido|signific|express[aã]o|palavra em destaque', 'Semântica e vocabulário'),
        ]
        fallback = 'Interpretação de textos'
    elif macro == 'Matemática':
        rules = [
            (r'probabilid|possibilidades|combinac|permutac|arranj|escolh[ae]|sortead|loteria|aposta|anagram', 'Análise combinatória e probabilidade'),
            (r'm[eé]dia|mediana|moda|frequ[eê]ncia|desvio padr[aã]o|pesquisa|tabela.*(?:dados|pre[cç]o)', 'Estatística e leitura de dados'),
            (r'progress[aã]o|sequ[eê]ncia|sucess[aã]o|termo geral|raz[aã]o (?:da|de uma) p[ag]', 'Sequências e progressões'),
            (r'fun[cç][aã]o|f\(x\)|g\(x\)|par[aá]bola|gr[aá]fico|exponencial|logaritm', 'Funções e gráficos'),
            (r'equa[cç][aã]o|sistema linear|ra[ií]zes|polin[oô]m|n[uú]meros complexos', 'Equações e álgebra'),
            (r'[aá]rea|volume|per[ií]metro|tri[aâ]ngulo|ret[aâ]ngulo|quadril[aá]tero|c[ií]rculo|cil[ií]ndr|cubo|c[uú]bic|paralelep|[aâ]ngulo|lado|diagonal|esfera|cone|planta de um terreno', 'Geometria e medidas'),
            (r'porcent|percent|desconto|juros|capital|rendimento|taxa de|lucro|investi|pre[cç]o|custo|reais|r\$', 'Porcentagem e matemática financeira'),
            (r'propor[cç]|regra de tr[eê]s|escala|convers[aã]o|raz[aã]o entre|velocidade m[eé]dia', 'Razões e proporções'),
        ]
        fallback = 'Raciocínio aritmético'
    elif macro == 'Informática':
        rules = [(r'excel|planilh|f[oó]rmulas? predefinid', 'Planilhas eletrônicas'),
                 (r'atalho|teclas?', 'Atalhos e operações'),
                 (r'formata[cç]|documento|rodap[eé]|menu|texto', 'Editor de textos')]
        fallback = 'Aplicativos e sistemas'
    elif macro == 'Metrologia e Instrumentação':
        rules = [(r'paqu[ií]metr|micr[oô]metr|rel[oó]gio comparador|n[oô]nio|vernier', 'Instrumentos de medição dimensional'),
                 (r'press[aã]o|termopar|temperatura|vaz[aã]o|man[oô]metro|sensor|transdutor', 'Sensores e medição de processos'),
                 (r'calibra[cç]|rastreabil|incerteza|exatid[aã]o|precis[aã]o|erro de medi[cç]', 'Calibração, erros e incerteza'),
                 (r'normas?|padr[oõ]es|metrologia', 'Fundamentos de metrologia')]
        fallback = 'Medição e instrumentação industrial'
    elif macro == 'Equipamentos Mecânicos e Máquinas Térmicas':
        rules = [(r'bomba|gaxeta|selo mec[aâ]nico', 'Bombas, gaxetas e selos'),
                 (r'compressor', 'Compressores'),
                 (r'trocador|transfer[eê]ncia de calor|calor', 'Trocadores e transferência de calor'),
                 (r'motor|ciclo rankine|caldeira|combust[aã]o|gerador', 'Motores e ciclos térmicos'),
                 (r'eleva[cç][aã]o|movimenta[cç]|talha|cabo de a[cç]o', 'Movimentação e elevação')]
        fallback = 'Equipamentos industriais'
    else:
        rules = [(r'tratamento t[eé]rmico|t[eê]mpera|revenimento|recozimento|normaliza[cç][aã]o|microestrutura|metalografi', 'Tratamentos térmicos e microestrutura'),
                 (r'ensaio|dureza|tra[cç][aã]o|impacto|fadiga|flu[eê]ncia', 'Ensaios e propriedades mecânicas'),
                 (r'a[cç]o|ferro|liga|diagrama ferro', 'Aços, ligas e metalurgia'),
                 (r'pol[ií]mer|cer[aâ]mic', 'Polímeros e cerâmicas')]
        fallback = 'Materiais e propriedades'
    for pattern, label in rules:
        if matches(s, pattern):
            return label
    return fallback

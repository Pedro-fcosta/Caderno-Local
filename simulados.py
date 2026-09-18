"""Sorteio estratificado pela frequência histórica dos assuntos das provas."""
from collections import Counter, defaultdict
import random


def choose_questions(rows, amount, rng=None):
    """Seleciona IDs distintos; preserva proporções macro/micro mesmo ao repetir questões.

    Mistura 92% da frequência observada com 8% distribuídos pelos assuntos
    presentes; a pequena reserva dá chance a tópicos raros. Cotas são ajustadas
    enquanto a prova é formada, sem eliminar temas cujas questões já foram vistas.
    """
    rng = rng or random.Random()
    groups = defaultdict(lambda: defaultdict(list))
    for row in rows:
        groups[row['macro']][row['micro']].append(row)
    if not groups or amount < 1:
        return []
    amount = min(amount, len(rows))
    count_macro = Counter({macro:sum(len(c) for c in micros.values()) for macro,micros in groups.items()})
    total = sum(count_macro.values())
    quota_macro = {m:amount*(.92*n/total+.08/len(groups)) for m,n in count_macro.items()}
    quota_micro = {}
    for macro,micros in groups.items():
        for micro,candidates in micros.items():
            quota_micro[macro,micro] = quota_macro[macro]*(.92*len(candidates)/count_macro[macro]+.08/len(micros))
    used_macro,used_micro=Counter(),Counter()
    chosen=[]
    for _ in range(amount):
        available=[m for m,micros in groups.items() if any(c for c in micros.values())]
        macro=rng.choices(available,weights=[max(.02,quota_macro[m]-used_macro[m]) for m in available])[0]
        options=[micro for micro,candidates in groups[macro].items() if candidates]
        micro=rng.choices(options,weights=[max(.02,quota_micro[macro,t]-used_micro[macro,t]) for t in options])[0]
        candidates=groups[macro][micro]
        weights=[]
        for q in candidates:
            attempts=q['attempts']
            # Inéditas primeiro; erro e dúvida elevam a chance de repetição.
            weight=(16 if attempts==0 else 1+min(q['mistakes'],3)*2+min(q['doubts'],2)*2+2*bool(q['marked']))
            weights.append(weight)
        choice=rng.choices(candidates,weights=weights)[0]
        candidates.remove(choice)
        chosen.append(choice['id'])
        used_macro[macro]+=1
        used_micro[macro,micro]+=1
    rng.shuffle(chosen)
    return chosen


def quota_preview(rows, amount):
    counts=Counter(row['macro'] for row in rows)
    total=sum(counts.values())
    return [{'macro':macro,'count':count,'percent':round(count/total*100,1),
             'estimate':round(amount*(.92*count/total+.08/len(counts)))}
            for macro,count in counts.most_common()] if total else []

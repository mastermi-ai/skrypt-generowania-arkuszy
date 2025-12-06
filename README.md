# Wizualizator Arkuszy DTF (Proof of Concept)

Aplikacja webowa do wizualizacji generowania arkuszy DTF (Direct to Film) na podstawie pliku CSV z zamówieniami i zestawu grafik PNG.

## Funkcje

- **Parsowanie CSV**: Automatycznie wyodrębnia SKU, Numer zamówienia i Notatki.
- **Dobór Wariantu (Logika Biznesowa)**:
  - **Priorytet 1 (Override)**: Jeśli w kolumnie `NOTATKI` znajduje się wpis `KOLOR: WH` lub `KOLOR: BK`, wariant ten jest wymuszany, niezależnie od SKU.
  - **Priorytet 2 (SKU)**: Jeśli SKU zawiera `_WH_` lub `_BK_`, wariant jest pobierany z nazwy.
  - **Fuzzy Matching**: Dla SKU bez wariantu (np. `_MIX_`, `_OS`), aplikacja szuka pasujących plików po nazwie bazowej.
- **Automatyczne Układanie (Packing)**: Używa algorytmu półkowego ("Shelf") do układania grafik na arkuszu o szerokości 58cm z odstępem 20mm.
- **Konfiguracja Arkuszy**: Możliwość wyboru trybu:
  - **Osobne arkusze (WH/BK)**: Domyślnie, grafiki są grupowane na osobnych arkuszach dla bieli i czerni.
  - **Wspólny arkusz**: Wszystkie grafiki na jednym arkuszu (Mixed).
- **Wizualizacja**: Interaktywny podgląd wygenerowanych arkuszy z siatką i liniami cięcia.
- **Diagnostyka**: Szczegółowe informacje o źródle dopasowania wariantu (Note Override, SKU, Fuzzy Match, Fallback).
- **Eksport**: Pobieranie podglądu arkusza jako PNG.

## Uruchomienie

1. **Instalacja zależności**:
   ```bash
   npm install
   ```

2. **Uruchomienie serwera developerskiego**:
   ```bash
   npm run dev
   ```

3. **Otwórz aplikację**:
   Przejdź pod adres [http://localhost:3000](http://localhost:3000).

## Instrukcja Obsługi

1. **Wgraj CSV**: Przeciągnij plik `orders.csv` (przykłady w `public/samples`) w pole "Orders".
2. **Wgraj Grafiki**: Przeciągnij pliki PNG (przykłady w `public/samples`) w pole "Designs".
3. **Sprawdź Wyniki**:
   - Panel "Status" pokaże liczbę dopasowanych zamówień.
   - Sekcja "Diagnostics" wyjaśni, dlaczego dany wariant został wybrany (np. "NOTE OVERRIDE").
4. **Konfiguracja**:
   - Użyj przełączników w panelu bocznym, aby włączyć/wyłączyć rotację 90° lub rozdzielanie arkuszy.
5. **Pobierz**: Kliknij "Download Preview PNG", aby zapisać wizualizację.

## Założenia i Ograniczenia (PoC)

- **Szerokość Arkusza**: Stała 580mm.
- **DPI**: Przyjmuje 300 DPI dla skalowania obrazów (1px = 0.0846mm).
- **Kolory**: Podgląd w RGB. Produkcyjne pliki powinny być konwertowane do CMYK.
- **Packing**: Prosty algorytm zachłanny. Nie obsługuje zaawansowanego zagnieżdżania (nesting).

## Technologie

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide React (Ikony)

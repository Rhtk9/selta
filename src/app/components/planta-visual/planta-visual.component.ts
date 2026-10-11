import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type NivelSaude = 'alta' | 'media' | 'baixa' | 'critica';
export type NivelAgua = 'seca' | 'ideal' | 'encharcada';
export type NivelFelicidade = 'feliz' | 'neutra' | 'triste';

@Component({
  selector: 'app-planta-visual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planta-visual.component.html',
  styleUrls: ['./planta-visual.component.scss']
})
export class PlantaVisualComponent implements OnChanges {
  @Input() estagioVisual: number = 1;
  @Input() nivelSaude: NivelSaude = 'alta';
  @Input() nivelAgua: NivelAgua = 'ideal';
  @Input() nivelFelicidade: NivelFelicidade = 'feliz';
  @Input() tamanho: number = 220;

  svgInline: SafeHtml | null = null;
  private requisicaoAtual = 0;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estagioVisual']) {
      this.carregarSvgInline();
    }
  }

  private carregarSvgInline(): void {
    const requisicao = ++this.requisicaoAtual;
    const estagio = this.getEstagio();
    this.svgInline = null;

    this.http.get(this.getEstagioUrl(), { responseType: 'text' }).subscribe({
      next: (svg) => {
        if (requisicao !== this.requisicaoAtual) return;
        this.svgInline = this.sanitizer.bypassSecurityTrustHtml(this.prepararSvg(svg, estagio));
      },
      error: () => {
        if (requisicao === this.requisicaoAtual) this.svgInline = null;
      }
    });
  }

  private prepararSvg(conteudo: string, estagio: number): string {
    const documento = new DOMParser().parseFromString(conteudo, 'image/svg+xml');
    const svg = documento.documentElement;
    const grupoOriginal = svg.querySelector('g');
    const namespace = svg.namespaceURI || 'http://www.w3.org/2000/svg';

    if (!grupoOriginal || documento.querySelector('parsererror')) return conteudo;

    const grupoAereo = documento.createElementNS(namespace, 'g');
    grupoAereo.setAttribute('class', 'plant-aerial');
    const grupoSolo = documento.createElementNS(namespace, 'g');
    grupoSolo.setAttribute('class', 'plant-soil');
    const grupoSoloFrontal = estagio === 1
      ? documento.createElementNS(namespace, 'g')
      : null;
    grupoSoloFrontal?.setAttribute('class', 'plant-soil plant-soil-cover');

    for (const forma of Array.from(grupoOriginal.children)) {
      const classes = forma.getAttribute('class')?.split(/\s+/) || [];
      if (classes.includes('st2')) {
        grupoSolo.appendChild(forma);
        grupoSoloFrontal?.appendChild(forma.cloneNode(true));
      } else {
        grupoAereo.appendChild(forma);
      }
    }

    grupoOriginal.append(grupoSolo, grupoAereo);
    if (grupoSoloFrontal) grupoOriginal.appendChild(grupoSoloFrontal);
    return new XMLSerializer().serializeToString(svg);
  }

  private getEstagio(): number {
    return Math.min(5, Math.max(1, Math.round(this.estagioVisual)));
  }

  getEstagioUrl(): string {
    return `/assets/estagios/estagio-${this.getEstagio()}.svg`;
  }
}
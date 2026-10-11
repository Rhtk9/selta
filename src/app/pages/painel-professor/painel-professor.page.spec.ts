import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PainelProfessorPage } from './painel-professor.page';

describe('PainelProfessorPage', () => {
  let component: PainelProfessorPage;
  let fixture: ComponentFixture<PainelProfessorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PainelProfessorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastrarEspeciePage } from './cadastrar-especie.page';

describe('CadastrarEspeciePage', () => {
  let component: CadastrarEspeciePage;
  let fixture: ComponentFixture<CadastrarEspeciePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CadastrarEspeciePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

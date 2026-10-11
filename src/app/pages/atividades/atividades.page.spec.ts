import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AtividadesPage } from './atividades.page';

describe('AtividadesPage', () => {
  let component: AtividadesPage;
  let fixture: ComponentFixture<AtividadesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AtividadesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

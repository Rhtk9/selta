import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuidadosPlantaPage } from './cuidados-planta.page';

describe('CuidadosPlantaPage', () => {
  let component: CuidadosPlantaPage;
  let fixture: ComponentFixture<CuidadosPlantaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CuidadosPlantaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

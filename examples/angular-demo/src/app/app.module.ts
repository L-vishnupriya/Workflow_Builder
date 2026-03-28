import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";
import { JsonPreviewComponent } from "./json-preview/json-preview.component";
import { ValidationPanelComponent } from "./validation-panel/validation-panel.component";
import { WorkflowBuilderComponent } from "./workflow-builder/workflow-builder.component";

@NgModule({
  declarations: [
    AppComponent,
    WorkflowBuilderComponent,
    JsonPreviewComponent,
    ValidationPanelComponent,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}

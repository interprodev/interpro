# Buttons Documentation

This documentation provides an overview of the various button styles available in our UI library. 
Each button style is showcased with different attributes to demonstrate its versatility and usage.
Copy the code snippets and paste them into your project to use the buttons.

## Buttons

```
### Default Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Default</h2>
  <div class="tw-flex tw-gap-4">
    <p-button label="Primary"></p-button>
    <p-button label="Disabled" [disabled]="true"></p-button>
    <p-button label="Rounded" [rounded]="true"></p-button>
    <p-button label="Raised" [raised]="true"></p-button>
    <p-button label="Outlined" [outlined]="true"></p-button>
    <p-button label="small" [size]="'small'"></p-button>
    <p-button label="Icon" [icon]="'fas fa-home'"></p-button>
    <p-button [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Primary Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Primary</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4">
    <p-button label="Secondary" styleClass="p-button-secondary"></p-button>
    <p-button label="Disabled" styleClass="p-button-secondary" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-secondary" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-secondary" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-secondary" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-secondary" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-secondary" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-secondary" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Success Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Success</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4">
    <p-button label="Success" styleClass="p-button-success"></p-button>
    <p-button label="Disabled" styleClass="p-button-success" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-success" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-success" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-success" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-success" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-success" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-success" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Info Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Info</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4">
    <p-button label="Info" styleClass="p-button-info"></p-button>
    <p-button label="Disabled" styleClass="p-button-info" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-info" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-info" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-info" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-info" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-info" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-info" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Warning Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Warning</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4">
    <p-button label="Warning" styleClass="p-button-warning"></p-button>
    <p-button label="Disabled" styleClass="p-button-warning" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-warning" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-warning" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-warning" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-warning" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-warning" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-warning" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Danger Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Danger</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4">
    <p-button label="Danger" styleClass="p-button-danger"></p-button>
    <p-button label="Disabled" styleClass="p-button-danger" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-danger" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-danger" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-danger" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-danger" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-danger" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-danger" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>

### Contrast Buttons
<div class="tw-bg-shark-950 tw-opacity-95 tw-mt-4 tw-p-4 tw-rounded">
  <h2>Contrast</h2>
  <div class="tw-mt-8 tw-flex tw-gap-4 tw-bg-white tw-p-2 tw-rounded">
    <p-button label="Contrast" styleClass="p-button-contrast"></p-button>
    <p-button label="Disabled" styleClass="p-button-contrast" [disabled]="true"></p-button>
    <p-button label="Rounded" styleClass="p-button-contrast" [rounded]="true"></p-button>
    <p-button label="Raised" styleClass="p-button-contrast" [raised]="true"></p-button>
    <p-button label="Outlined" styleClass="p-button-contrast" [outlined]="true"></p-button>
    <p-button label="small" styleClass="p-button-contrast" [size]="'small'"></p-button>
    <p-button label="Icon" styleClass="p-button-contrast" [icon]="'fas fa-home'"></p-button>
    <p-button styleClass="p-button-contrast" [icon]="'fas fa-heart'" [rounded]="true"></p-button>
  </div>
</div>
```
